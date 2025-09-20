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
     * Check if this schedule overlaps existing schedules for its location & cinema.
     * 
     * @param {*} transactionConn A db connection in a transaction.
     * @param {number} ignoreSchId An optional parameter to ignore a schedule ID. Used for updates. 
     */
    async overlaps(transactionConn, ignoreSchId = 0) {
        const status = {
            clash: false,
            err: null
        }
        try {
            const [scheduleClashCheck] = await transactionConn.execute(
                `SELECT 
                    UNIX_TIMESTAMP(?) AS 'startTime',
                    UNIX_TIMESTAMP(?) + duration AS 'endTime',
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', si.id,
                                'start', UNIX_TIMESTAMP(si.start_time),
                                'end', UNIX_TIMESTAMP(si.start_time + INTERVAL mi.duration MINUTE)
                            )
                        )
                        FROM Schedule si
                        INNER JOIN Movie mi ON si.movie_id = mi.id
                        WHERE mi.id = ?
                        AND si.location_id = ?
                        AND si.cinema_id = ?
                        AND si.id != ?
                        AND DATE(si.start_time)
                            BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
                        AND si.available = true
                        ORDER BY si.start_time
                    ) AS 'existing'
                FROM Movie
                WHERE id = ?`,
                [this.time, this.time, this.movie, this.location, this.cinema,
                    ignoreSchId, this.time, this.time, this.movie]
            );
            if (scheduleClashCheck.length === 0) {
                throw "Movie ID does not exist";
            }
            const startTime = +scheduleClashCheck[0].startTime;
            const endTime = +scheduleClashCheck[0].endTime;
            // JSON_ARRAYAGG() returns null when there are no rows
            const existing = scheduleClashCheck[0].existing ? scheduleClashCheck[0].existing : [];

            status.clash = existing.some(sch => startTime < sch.end && sch.start < endTime);
        } catch (err) {
            logger.error(`Schedule.overlaps(): ${err}`);
            status.err = err;
        }
        return status;
    }

    /**
     * ADMIN
     * 
     * Save the calling Schedule object into the database as a new schedule.
     * Fails if the movie ID does not exist or if the new schedule creates
     * a scheduling conflict.
     */
    async saveNewInDb() {
        const status = {
            schedule_id: null,
            err: null
        };

        var conn = null;
        try {
            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();
            const clashCheck = await this.overlaps(conn);

            if (clashCheck.err === "Movie ID does not exist") {
                throw clashCheck.err;
            }
            if (clashCheck.err) {
                throw "DB operation failed";
            }
            if (clashCheck.clash) {
                throw "Schedule clash";
            }

            const [result, _] = await conn.execute(
                `INSERT INTO Schedule
                    (cinema_id, location_id, movie_id, start_time, available)
                VALUES (?, ?, ?, ?, ?)`,
                [this.cinema, this.location, this.movie, this.time, true]
            );

            if (result.affectedRows === 0) {
                throw "DB operation failed";
            }
            status.schedule_id = result.insertId;
            await conn.commit();
        } catch (err) {
            logger.error(`Schedule.saveNewInDB(${JSON.stringify(this)}) : ${err}`);
            if (conn !== null) {
                await conn.rollback();
            }
            status.err = err;
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

            const clashCheck = await this.overlaps(conn, id);
            if (clashCheck.err) {
                throw "DB operation failed";
            }
            if (clashCheck.clash) {
                throw "Schedule clash";
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
     * @param {number} requesterUserId
     * @returns {Object}
     */
    static async findById(id, requesterUserId = 0) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT
                    l.address AS 'address',
                    c.friendly_name AS 'cinema',
                    m.title AS 'title',
                    'TODO: poster' AS 'poster',
                    s.start_time AS 'time',
                    s.available AS 'available',
                    ? IN (
                        SELECT r.user_id
                        FROM Reservation r
                        INNER JOIN Schedule s ON r.schedule_id = s.id
                        WHERE r.kind = 'confirmed'
                    ) AS 'requesterHasReservation'
                FROM Schedule s
                INNER JOIN Cinema c ON s.location_id = c.location_id AND s.cinema_id = c.id
                INNER JOIN Location l ON c.location_id = l.id
                INNER JOIN Movie m ON s.movie_id = m.id
                WHERE s.id = ?
                LIMIT 1;`,
                [requesterUserId, id]
            );
            if (rows.length === 0) {
                return "No result";
            }
            // Convert MySQL boolean (tinyint) to bool
            rows[0].available = rows[0].available === 1;
            rows[0].requesterHasReservation = rows[0].requesterHasReservation === 1;
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
