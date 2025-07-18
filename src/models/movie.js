import { dbConnPool } from "../services/database.js"; 
import { Check, verify } from "../utils/checker.js";

export class Movie {
    id;
    title;
    description;
    duration;
    poster;
    available;
    genres;

    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.duration = data.duration;
        this.poster = "TODO";
        this.genres = data.genres;
    }

    static validateFields(data) {
        // Movie ID is optional in the case of adding a new movie
        if (data.id && !verify(data.id, [Check.IS_ONLY_DIGITS])) {
            console.log("id failed");
            return false;
        }
        if (data.title.length > 4 && !verify(data.title, [Check.IS_ALPHANUMERICAL])) {
            console.log("title failed", data.title);
            return false;
        }
        if (data.description.length > 4 && !verify(data.description, [Check.IS_ALPHANUMERICAL])) {
            console.log("description failed");
            return false;
        }
        if (!verify(data.duration, [Check.IS_POSITIVE_NUMBER, Check.IS_ONLY_DIGITS])) {
            console.log("duration failed");
            return false;
        }
        // TODO: poster
        if (!verify(data.genres, [Check.IS_ALPHABETICAL_ARR])) {
            console.log("genres failed");
            return false;
        }
        return true;
    }

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
            console.log(err);
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
            console.log(err);
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
            console.log(err);
            return null;
        }
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
            console.log(err);
        }
        return status;
    }
}
