import { dbConnPool } from "../services/database.js"; 

export class Movie {
    id;
    title;
    description;
    duration;
    poster;
    genres;

    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.duration = data.duration;
        this.poster = "TODO";
        this.genres = data.genres;
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
    
}
