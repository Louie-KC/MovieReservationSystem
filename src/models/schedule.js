import { dbConnPool } from "../services/database.js"; 
import { logger } from '../utils/logger.js';
import { Check, verify } from "../utils/checker.js";

export class Schedule {
    // Fields for admin client request(s).

    /**
     * @param {Object} param
     * @param {number} param.movie 
     * @param {number} param.location
     * @param {number} param.cinema 
     * @param {Date} param.time
     */
    constructor({ movie, location, cinema, time }) {
        this.movie = movie;
        this.location = location;
        this.cinema = cinema;
        this.time = time;
    }

    static validateFields(data) {
        if (!verify(data.movie, [Check.IS_INTEGER])) {
            logger.debug("movie fail");
            return false;
        }
        if (!verify(data.location, [Check.IS_INTEGER])) {
            logger.debug("location fail");
            return false;
        }
        if (!verify(data.cinema, [Check.IS_INTEGER])) {
            logger.debug("cinema fail");
            return false;
        }
        if (!verify(data.time, [Check.IS_DATETIME])) {
            logger.debug("time fail");
            return false;
        }
        return true;
    }

    /**
     * ADMIN
     * 
     * Save the calling Schedule object into the database as a new schedule.
     * 
     * @returns Object { schedule_id, null }
     */
    async saveNewInDb() {
        const status = {
            schedule_id: null,
            err: null
        };

        try {
            const [result, _] = await dbConnPool.execute(
                `INSERT INTO Schedule
                    (cinema_id, location_id, movie_id, start_time, available)
                VALUES (?, ?, ?, ?, ?)`,
                [this.cinema, this.location, this.movie, this.time, true]
            );

            if (result.affectedRows === 0) {
                status.err = "DB operation failed"
            }
            status.schedule_id = result.insertId;
        } catch (err) {
            logger.error(`Schedule.saveNewInDB(${JSON.stringify(this)}) : ${err}`);
            status.err = err;
        }

        return status;
    }

    /**
     * ADMIN
     * 
     * Update the details of a schedule (specified by the `id`).
     * 
     * Unless `force` is true, the change is only commited if there are no
     * future confirmed reservations for the specified schedule.
     * 
     * @param {number} id
     * @param {boolean} force 
     */
    async updateInDB(id, force) {
        const status = {
            scheduleIdExists: false,
            blockedByReservation: false,
            exception: false
        };

        var conn = null;
        try {
            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();

            const [idCheck] = await conn.execute(
                `SELECT COUNT(id) AS 'exists'
                FROM Schedule
                WHERE id = ?`,
                [id]
            );
            status.scheduleIdExists = idCheck[0].exists === 1;
            if (!status.scheduleIdExists) {
                await conn.rollback();
                return status;  // Executes finally then returns
            }

            // Check for confirmed reservations for the schedule
            const [confirmedResCheck] = await conn.execute(
                `SELECT COUNT(r.id) AS 'count'
                FROM Reservation r
                INNER JOIN Schedule s ON r.schedule_id = s.id
                WHERE s.id = ?
                AND r.kind = 'confirmed'`,
                [id]
            );
            if (confirmedResCheck[0].count !== 0 && !force) {
                status.blockedByReservation = true;
                await conn.rollback();
                return status;
            }

            // Update schedule
            await conn.execute(
                `UPDATE Schedule
                SET movie_id = ?,
                    location_id = ?,
                    cinema_id = ?,
                    start_time = ?
                WHERE id = ?`,
                [this.movie, this.location, this.cinema, this.time, id]
            );

            await conn.commit();
        } catch (err) {
            logger.error(`Schedule.updateInDB(${JSON.stringify(this)},${id},${force}) : ${err}`);
            if (conn !== null) {
                await conn.rollback();
            }
            status.exception = true;
        } finally {
            if (conn !== null) {
                conn.release();
            }
        }

        return status;
    }

    /**
     * ADMIN
     * 
     * Soft delete a schedule by an `id`, marking it as unavailable.
     * 
     * Unless `force` is true, the update is only commited if there are no
     * confirmed reservations for the specified movie.
     * When `force` is true, all reservations are cancelled.
     * 
     * @param {number} id 
     * @param {boolean} force 
     */
    static async softDeleteInDb(id, force) {
        const status = {
            scheduleIdExists: false,
            blockedByReservation: false,
            exception: false
        };

        var conn = null;

        try {
            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();

            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();

            const [idCheck] = await conn.execute(
                `SELECT COUNT(id) AS 'exists'
                FROM Schedule
                WHERE id = ?`,
                [id]
            );
            status.scheduleIdExists = idCheck[0].exists === 1;
            if (!status.scheduleIdExists) {
                await conn.rollback();
                return status;  // Executes finally then returns
            }

            // Check for confirmed reservations for schedule
            const [confirmedResCheck] = await conn.execute(
                `SELECT COUNT(r.id) AS 'count'
                FROM Reservation r
                INNER JOIN Schedule s ON r.schedule_id = s.id
                WHERE s.id = ?
                AND r.kind = 'confirmed'`,
                [id]
            );
            if (confirmedResCheck[0].count !== 0) {
                if (force) {
                    // Cancel tentative & confirmed reservations
                    await conn.execute(
                        `UPDATE Reservation r
                        INNER JOIN Schedule s ON r.schedule_id = s.id
                        SET r.kind = 'cancelled'
                        WHERE r.kind != 'cancelled'
                        AND s.id = ?`,
                        [id]
                    );
                } else {
                    status.blockedByReservation = true;
                    await conn.rollback();
                    return status;  // Executes finally then returns
                }
            }

            // Update schedule
            await conn.execute(
                `UPDATE Schedule
                SET available = false
                WHERE id = ?`,
                [id]
            );

            await conn.commit();
        } catch (err) {
            logger.error(`Schedule.softDeleteInDb(${id},${force}) : ${err}`);
            if (conn !== null) {
                await conn.rollback();
            }
            status.exception = true;
        } finally {
            if (conn !== null) {
                conn.release();
            }
        }

        return status;
    }

    // Read operations

    /**
     * Find all available schedules for a given `locationId` and `date`.
     * 
     * @param {number} locationId 
     * @param {string} date in YYYY-MM-DD format
     */
    static async findAvailableByLocationDate(locationId, date) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT
                    id AS 'id',
                    start_time AS 'time',
                    movie_id AS 'movie'
                FROM Schedule
                WHERE location_id = ?
                AND DATE(start_time) = ?
                AND available = true
                ORDER BY start_time`,
                [locationId, date]
            );
            return rows;
        } catch (err) {
            logger.error(`Schedule.findByLocationDate(${locationId},${date}) : ${err}`);
            return null;
        }
    }

    /**
     * Retrieve the high level overview of the schedule. This involves the location
     * address, cinema name, movie title, and schedule start time.
     * 
     * @param {number} id 
     * @returns {Object}
     */
    static async findById(id) {
        try {
            const [rows, _] = await dbConnPool.execute(
                "SELECT l.address, c.friendly_name as 'cinema', m.title, 'TODO: poster', s.start_time as 'time'\
                FROM Schedule s\
                INNER JOIN Cinema c ON s.location_id = c.location_id AND s.cinema_id = c.id\
                INNER JOIN Location l ON c.location_id = l.id\
                INNER JOIN Movie m ON s.movie_id = m.id\
                WHERE s.id = ?\
                LIMIT 1;",
                [id]
            );
            if (rows.length === 0) {
                return "No result";
            }
            return rows[0];
        } catch (err) {
            logger.error(`Schedule.findById(${id}): ${err}`);
            return null;
        }
    }

    /**
     * Find the seating availability of a schedules assigned cinema.
     * 
     * @param {number} id
     * @returns {Object}
     */
    static async findSeatingAvailabilityById(id) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT
                    CONCAT(cs.seat_row, cs.seat_number) as 'seat',
                    reserved.seat_id IS NULL as 'available'
                FROM Schedule s
                INNER JOIN Cinema c ON s.location_id = c.location_id AND s.cinema_id = c.id
                INNER JOIN CinemaSeat cs ON c.id = cs.cinema_id AND c.location_id = cs.location_id
                LEFT JOIN (
                    SELECT r.schedule_id, rs.seat_id
                    FROM Reservation r
                    INNER JOIN ReservationSeat rs ON r.id = rs.reservation_id
                    WHERE r.schedule_id = ?
                    AND r.kind != 'cancelled'
                ) AS reserved ON cs.id = reserved.seat_id AND s.id = reserved.schedule_id
                WHERE s.id = ?`,
                [id, id]
            );
            // Reserved seats found separately to main query in order to prevent
            // seats reserved in multiple schedules from showing multiple times

            // MySQL boolean (tinyint) into an actual boolean value
            rows.forEach((row) => row.available = row.available === 1);

            return rows;
        } catch (err) {
            logger.error(`Schedule.findSeatingAvailabilityById(${id}): ${err}`);
            return null;
        }
    }

    /**
     * ADMIN
     * 
     * Retrieve all schedules for a specific cinema for a date.
     * 
     * @param {number} locationId 
     * @param {number} cinemaId 
     * @param {string} date YYYY-MM-DD
     * @returns 
     */
    static async findCinemaSchedule(locationId, cinemaId, date) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT
                    s.id,
                    m.title,
                    s.start_time as 'start',
                    DATE_ADD(s.start_time, INTERVAL m.duration MINUTE) as 'end'
                FROM Schedule s
                INNER JOIN Movie m ON s.movie_id = m.id
                WHERE s.location_id = ?
                AND s.cinema_id = ?
                AND DATE(s.start_time) = ?`,
                [locationId, cinemaId, date]
            );
            
            return rows;
        } catch (err) {
            logger.error(`Schedule.findCinemaSchedule(${locationId},${cinemaId},${date}): ${err}`);
            return null;
        }
    }
}
