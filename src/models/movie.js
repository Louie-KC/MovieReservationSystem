import { dbConnPool } from "../services/database.js"; 
import { logger } from '../utils/logger.js';
import { Check, verify } from "../utils/checker.js";

export class Movie {
    // Input methods for client requests.

    /**
     * @param {Object} param
     * @param {number} param.id
     * @param {string} param.title 
     * @param {string} param.duration
     * @param {number} param.duration
     * @param {*} param.poster
     * @param {string[]} param.genres
     */
    constructor({ id, title, description, duration, poster = "TODO", genres }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.poster = poster;
        this.genres = genres;
    }

    /**
     * Validate an input JSON object, typically from a client request.
     * 
     * @param {Object} data
     * @returns {boolean}
     */
    static validateFields(data) {
        // Movie ID is optional in the case of adding a new movie
        if (data.id && !verify(data.id, [Check.IS_INTEGER])) {
            logger.debug("id fail");
            return false;
        }
        if (!verify(data.title, [Check.IS_ALPHANUMERICAL]) || data.title.length < 4) {
            logger.debug("title fail");
            return false;
        }
        if (!verify(data.description, [Check.IS_ALPHANUMERICAL]) || data.description.length < 4) {
            logger.debug("description fail");
            return false;
        }
        if (!verify(data.duration, [Check.IS_POSITIVE_NUMBER, Check.IS_INTEGER])) {
            logger.debug("duration fail");
            return false;
        }
        // TODO: poster
        if (!verify(data.genres, [Check.IS_ALPHABETICAL_ARR])) {
            logger.debug("genres fail");
            return false;
        }
        return true;
    }

    /**
     * ADMIN
     * 
     * Save the calling Movie object into the database as a new movie.
     * 
     * Insertions are commit only if the movie itself and its genres are all
     * successfully inserted. Failed genres are added to the `fail` array in
     * the return.
     * 
     * @returns Object { movie_suceeded: boolean, success: string[], fail: [...] }
     */
    async saveNewInDb() {
        const status = {
            movie_succeeded: false,
            movie_id: null,
            success: [],
            fail: []
        }

        const conn = await dbConnPool.getConnection();
        
        // Outer try-catch for Movie table entry
        try {
            await conn.beginTransaction();            
            const [movieResult, _] = await conn.execute(
                "INSERT INTO Movie (title, description, duration, poster_image, available) VALUES\
                    (?, ?, ?, ?, true)",
                [this.title, this.description, this.duration, null]
            );
            status.movie_succeeded = movieResult.affectedRows === 1;

            if (status.movie_succeeded) {
                for (const genre of this.genres) {
                    // Inner try-catch for each movie genre entry.
                    try {
                        const [result, _] = await conn.execute(
                            "INSERT INTO MovieGenre (movie_id, genre_name) VALUES\
                                (?, ?)",
                            [movieResult.insertId, genre]
                        );
                        if (result.affectedRows === 0) {
                            throw "0 rows affected";
                        }
                        status.success.push(genre);
                    } catch (genreErr) {
                        status.fail.push(genre);
                    }
                }
            }

            // Commit only if movie & all genres were successfully entered
            if (status.movie_succeeded && status.fail.length === 0) {
                status.movie_id = movieResult.insertId;
                await conn.commit();
            } else {
                await conn.rollback();
            }
        } catch (err) {
            logger.error(`Movie.saveNewInDB(${JSON.stringify(this)}) : ${err}`);
            await conn.rollback();
        } finally {
            conn.release();
        }
        return status;
    }

    /**
     * ADMIN
     * 
     * Update a movie record in the database with the calling Movie object.
     * 
     * Updates are commited only if the `id` param maps to a movie in the
     * database, and if all genres are valid. Failed genres are added to the
     * `failedGenres` array in the returned object.
     * 
     * @param {number} id
     */
    async updateInDb(id) {
        const status = {
            movieIdExists: false,
            exception: false,
            failedGenres: []
        };
        
        var conn = null;

        try {
            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();

            const [idCheck] = await conn.execute(
                `SELECT COUNT(id) AS 'exists'
                FROM Movie
                WHERE id = ?`,
                [id]
            );
            status.movieIdExists = idCheck[0].exists === 1;
            if (!status.movieIdExists) {
                await conn.rollback();
                return status;  // Executes finally then returns
            }
            
            // Clear existing genres
            await conn.execute(
                `DELETE mg
                FROM MovieGenre mg
                INNER JOIN Movie m ON mg.movie_id = m.id
                WHERE m.id = ?`,
                [id]
            );

            // Insert each genre, checking each for success
            for (const genre of this.genres) {
                try {
                    const [genreInsert] = await conn.execute(
                        `INSERT INTO MovieGenre (movie_id, genre_name) VALUES (?, ?)`,
                        [id, genre]
                    );
                    if (genreInsert.affectedRows === 0) {
                        status.failedGenres.push(genre);
                    }
                } catch (err) {
                    status.failedGenres.push(genre);
                }
            }
            if (status.failedGenres.length !== 0) {
                await conn.rollback();
                return status;  // Executes finally then returns
            }

            // Update movie record
            await conn.execute(
                // TODO: poster
                `UPDATE Movie
                SET title = ?,
                    description = ?,
                    duration = ?
                WHERE id = ?`,
                [this.title, this.description, this.duration, id]
            );

            await conn.commit();
        } catch (err) {
            logger.error(`Movie.updateInDb(${id},${JSON.stringify(this)}) : ${err}`);
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
     * Soft delete a movie by an `id` in the database by marking it as
     * unavailable.
     * 
     * Unless `force` is true, the change is only commited if there are no
     * future confirmed reservations for the specified movie.
     * 
     * @param {number} id 
     * @param {boolean} force 
     * @returns 
     */
    static async softDeleteInDb(id, force) {
        const status = {
            movieIdExists: false,
            blockedByReservation: false,
            exception: false
        };

        var conn = null;

        try {
            conn = await dbConnPool.getConnection();
            await conn.beginTransaction();

            const [idCheck] = await conn.execute(
                `SELECT COUNT(id) AS 'exists'
                FROM Movie
                WHERE id = ?`,
                [id]
            );
            status.movieIdExists = idCheck[0].exists === 1;
            if (!status.movieIdExists) {
                await conn.rollback();
                return status;  // Execute finally then return
            }

            // Check for future confirmed reservations for movie
            const [futureResCheck] = await conn.execute(
                `SELECT COUNT(r.id) AS 'res'
                FROM Reservation r
                INNER JOIN Schedule s ON r.schedule_id = s.id
                INNER JOIN Movie m ON s.movie_id = m.id
                WHERE r.kind = 'confirmed'
                AND m.id = ?
                AND s.start_time > NOW()`,
                [id]
            );
            if (futureResCheck[0].res !== 0) {
                logger.debug(force);
                if (force) {
                    // Clear/cancel tentative & confirmed reservations
                    await conn.execute(
                        `UPDATE Reservation r
                        INNER JOIN Schedule s ON r.schedule_id = s.id
                        INNER JOIN Movie m ON s.movie_id = m.id
                        SET r.kind = 'cancelled'
                        WHERE r.kind != 'cancelled'
                        AND m.id = ?
                        AND s.start_time > NOW()`,
                        [id]
                    );
                } else {
                    status.blockedByReservation = true;
                    await conn.rollback();
                    return status;  // Execute finally then return
                }
            }
            
            // Make movie unavailable
            await conn.execute(
                `UPDATE Movie
                SET available = false
                WHERE id = ?`,
                [id]
            );

            await conn.commit();
        } catch (err) {
            logger.error(`Movie.softDeleteInDb(${id}) : ${err}`);
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

    static async findAll() {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'
                FROM Movie m
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id
                WHERE m.available = true
                GROUP BY m.id`
            );
            return rows.map((row) => new Movie(row));
        } catch (err) {
            logger.error(`Movie.findAll(): ${err}`);
            return null;
        }
    }

    static async findByGenre(genre) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'
                FROM Movie m
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id
                WHERE m.id IN (
                    SELECT DISTINCT movie_id
                    FROM MovieGenre
                    WHERE genre_name = ?
                )
                AND m.available = true
                GROUP BY m.id`,
                [genre]
            );
            return rows.map((row) => new Movie(row));
        } catch (err) {
            logger.error(`Movie.findByGenre(${genre}): ${err}`);
            return null;
        }
    }

    static async findByID(id) {
        try {
            const [rows, _] = await dbConnPool.execute(
                `SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'
                FROM Movie m
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id
                WHERE m.id = ?
                GROUP BY m.id
                LIMIT 1`,
                [id]
            );
            if (rows.length === 0) {
                throw "No result";
            }
            const row = rows[0];

            return new Movie(row);
        } catch (err) {
            logger.error(`Movie.findByID(${id}): ${err}`);
            return null;
        }
    }
    
}
