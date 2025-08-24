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
     * Save the calling Movie object into the database as a new movie.
     * 
     * Insertions are commit only if the movie itself and its genres are all
     * successfully inserted. Failed genres are added to the `fail` array in
     * the return.
     * 
     * @returns Object { movie_suceeded: boolean, success: string[], fail: [...] }
     */
    async saveNewInDb() {
        const conn = await dbConnPool.getConnection();
        const status = {
            movie_succeeded: false,
            success: [],
            fail: []
        }
        
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
                await conn.commit();
            } else {
                await conn.rollback();
            }
        } catch (err) {
            logger.error(`Movie.saveNewInDB(${JSON.stringify(this)}) : ${err}`);
        }
        return status;
    }

    // Server only/specific functions

    static async findAll() {
        try {
            const [rows, _] = await dbConnPool.execute(
                "SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'\
                FROM Movie m\
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id\
                GROUP BY m.id"
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
                "SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'\
                FROM Movie m\
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id\
                WHERE m.id IN (\
                    SELECT DISTINCT movie_id\
                    FROM MovieGenre\
                    WHERE genre_name = ?\
                )\
                GROUP BY m.id",
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
                "SELECT m.*, JSON_ARRAYAGG(mg.genre_name) as 'genres'\
                FROM Movie m\
                INNER JOIN MovieGenre mg ON m.id = mg.movie_id\
                WHERE m.id = ?\
                GROUP BY m.id\
                LIMIT 1",
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
