import { dbConnPool } from "../services/database.js";
import { logger } from "../utils/logger.js";
import { Check, verify } from '../utils/checker.js';

export class Order {

    /**
     * @param {Object} body 
     * @returns {boolean}
     */
    static validateFieldsReserve(body) {
        if (!verify(body.schedule, [Check.IS_INTEGER])) {
            logger.debug('schedule fail');
            return false;
        }
        if (!verify(body.seats, [Check.IS_ALPHANUMERICAL_ARR])) {
            logger.debug('seats fail');
            return false;
        }
        if (body.seats.length === 0) {
            logger.debug("seats fail - empty");
            return false;
        }
        return true;
    }

    /**
     * @param {Object} body 
     * @returns {boolean}
     */
    static validateFieldsConfirmCancel(body) {
        if (!verify(body.id, [Check.IS_INTEGER])) {
            logger.debug('id fail');
            return false;
        }
        return true;
    }

    /**
     * Find the order history of a user by their ID.
     * 
     * @param {number} userId from requester JWT
     * @returns {Promise<{id, status, title, time, address, cinema, seats} | null>}
     */
    static async findHistoryByUserId(userId) {
        try {
            const [rows] = await dbConnPool.execute(
                `SELECT
                    r.id AS 'reservation',
                    s.id AS 'schedule',
                    r.kind AS 'status',
                    m.title AS 'title',
                    s.start_time AS 'time',
                    l.address AS 'address',
                    c.friendly_name AS 'cinema',
                    (
                        SELECT JSON_ARRAYAGG(CONCAT(csi.seat_row, csi.seat_number))
                        FROM Reservation ri
                        INNER JOIN ReservationSeat rsi ON ri.id = rsi.reservation_id
                        INNER JOIN CinemaSeat csi ON rsi.seat_id = csi.id
                        WHERE ri.id = r.id
                        ORDER BY CONCAT(csi.seat_row, csi.seat_number) ASC
                    ) AS 'seats'
                FROM Reservation r
                INNER JOIN Schedule s ON r.schedule_id = s.id
                INNER JOIN Cinema c ON s.cinema_id = c.id AND s.location_id = c.location_id
                INNER JOIN Location l ON c.location_id = l.id
                INNER JOIN Movie m ON s.movie_id = m.id
                WHERE r.user_id = ?
                ORDER BY s.start_time DESC`,
                [userId]
            );
            return rows;
        } catch (err) {
            logger.error(`Order.findHistoryByUserId(${userId}): ${err}`);
            return null;
        }
    }

    /**
     * Tentatively make a reservation in the database if all seats are
     * available and get the corresponding reservation id.
     * 
     * @param {number} userId The userId of the reserver
     * @param {Object} validatedBody See Order.validateFieldsReserve()
     */
    static async reserve(userId, validatedBody) {
        const status = {
            reserverationId: null,
            err: null
        };

        const conn = await dbConnPool.getConnection();
        try {
            await conn.beginTransaction();

            const [scheduleCheck] = await conn.execute(
                `SELECT id
                FROM Schedule
                where id = ?`,
                [validatedBody.schedule]
            );
            if (scheduleCheck.length !== 1) {
                throw "Invalid schedule";
            }

            const [reservedSeats] = await conn.execute(
                `SELECT rs.seat_id, CONCAT(cs.seat_row, cs.seat_number) as 'label'
                FROM Schedule s
                INNER JOIN Reservation r ON s.id = r.schedule_id
                INNER JOIN ReservationSeat rs on r.id = rs.reservation_id
                INNER JOIN CinemaSeat cs ON rs.seat_id = cs.id
                WHERE s.id = ?
                AND r.kind != 'Cancelled'
                ORDER BY rs.seat_id ASC`,
                [validatedBody.schedule]
            );
            // Are we trying to reverse already reserved seats?
            const reservedSet = new Set(reservedSeats.map(seat => seat.label));
            if (validatedBody.seats.some(seat => reservedSet.has(seat))) {
                throw "Seat already reserved"
            }

            // Create reservation
            const [reservationResult] = await conn.execute(
                `INSERT INTO Reservation (user_id, schedule_id, kind, last_updated) VALUES
                    (?, ?, "tentative", NOW())`,
                [userId, validatedBody.schedule]
            );
            const reservationId = reservationResult.insertId;
            
            // Find IDs of seats being reserved
            const seatIdsQuery = conn.format(
                `SELECT cs.id as 'id'
                FROM CinemaSeat cs
                INNER JOIN Cinema c ON cs.cinema_id = c.id AND cs.location_id = c.location_id
                INNER JOIN Schedule s ON c.id = s.cinema_id AND c.location_id = s.location_id
                WHERE s.id = ?
                AND CONCAT(cs.seat_row, cs.seat_number) IN (?)`,
                [validatedBody.schedule, validatedBody.seats]
            );
            const [seatIdsResult] = await conn.query(seatIdsQuery);
            if (seatIdsResult.length === 0) {
                throw "Error on finding seat IDs";
            }
            
            // Reserve the seats
            const insertData = seatIdsResult.map(seat => [reservationId, seat.id]);
            const seatInsertQuery = conn.format(
                `INSERT INTO ReservationSeat (reservation_id, seat_id) VALUES ?`,
                [insertData]
            );
            const [seatReservationResult] = await conn.query(seatInsertQuery);
            if (seatReservationResult.affectedRows !== validatedBody.seats.length) {
                throw "Failed to reserve all requested seats"
            }

            status.reserverationId = reservationId;
            await conn.commit();
        } catch (err) {
            if (conn) {
                await conn.rollback();
            }
            logger.error(`Order.reserve(${userId},${JSON.stringify(validatedBody)}) : ${err}`);
            status.err = err;
        } finally {
            conn.release();
        }

        return status;
    }

    /**
     * Confirm a reservation for a particular userId by the reservation ID.
     * 
     * Succeeds only if the reservation:
     * * Has a matching reservation ID
     * * Is made by the `userId`
     * * Is currently 'tentative'
     * * Is not scheduled in the past
     * 
     * @param {number} userId From requester JWT
     * @param {Object} validatedBody See Order.validateFieldsConfirmCancel()
     * @returns 
     */
    static async confirmRevervation(userId, validatedBody) {
        const status = {
            success: false,
            err: null
        };

        try {
            const [confirmResult] = await dbConnPool.execute(
                `UPDATE Reservation
                SET kind = 'confirmed'
                WHERE id = ?
                AND user_id = ?
                AND kind = 'tentative'`,
                [validatedBody.id, userId]
            );
            status.success = confirmResult.affectedRows === 1;
        } catch (err) {
            logger.error(`Order.confirmRevervation(${JSON.stringify(validatedBody)}) : ${err}`);
            status.err = err;
        }

        return status;
    }

    /**
     * Cancels a reservation for a particular userId by the reservation ID.
     * 
     * Succeeds only if the reservation:
     * * Has a matching reservation ID
     * * Is made by the `userId`
     * * Is currently 'tentative' or 'confirmed'
     * * Is not scheduled in the past
     * 
     * @param {number} userId from requester JWT
     * @param {Object} validatedBody See Order.validateFieldsConfirmCancel()
     */
    static async cancelRevervation(userId, validatedBody) {
        const status = {
            success: false,
            err: null
        };

        try {
            const [confirmResult] = await dbConnPool.execute(
                `UPDATE Reservation
                SET kind = 'cancelled'
                WHERE id = ?
                AND user_id = ?
                AND kind != 'cancelled'`,
                [validatedBody.id, userId]
            );
            status.success = confirmResult.affectedRows === 1;
        } catch (err) {
            logger.error(`Order.confirmRevervation(${JSON.stringify(validatedBody)}) : ${err}`);
            status.err = err;
        }

        return status;
    }
}
