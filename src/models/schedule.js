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
        if (!verify(data.movie, [Check.IS_ONLY_DIGITS])) {
            logger.debug("movie fail");
            return false;
        }
        if (!verify(data.location, [Check.IS_ONLY_DIGITS])) {
            logger.debug("location fail");
            return false;
        }
        if (!verify(data.cinema, [Check.IS_ONLY_DIGITS])) {
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
     * @returns Object { success, null }
     */
    async saveNewInDb() {
        const status = {
            success: false,
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
            status.success = result.affectedRows === 1;
        } catch (err) {
            logger.error(`Schedule.saveNewInDB(${JSON.stringify(this)}) : ${err}`);
            status.err = err;
        }

        return status;
    }

    // Read operations

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
