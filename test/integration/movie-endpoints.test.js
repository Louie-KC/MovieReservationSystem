import request from 'supertest';
import { dbConnPool } from '../../src/services/database.js';
import { app, server } from '../../src/app.js';

const TEST_MOVIE_1_TITLE = "Jest Movie 1";
const TEST_MOVIE_2_TITLE = "Jest Movie 2";
const TEST_MOVIE_3_TITLE = "Jest Movie 3";
const TEST_MOVIE_GENRE_1 = "JestGenreOne";
const TEST_MOVIE_GENRE_2 = "JestGenreTwo";
const TEST_MOVIE_GENRE_3 = "JestGenreThree";
const TEST_MOVIE_GENRE_4 = "JestGenreFour";
var testMovie1Id = null;
var testMovie2Id = null;
var testMovie3Id = null;

async function clearTestMovieData() {
    await dbConnPool.execute(  // First: Joins Movie and MovieGenreCategory
        `DELETE FROM MovieGenre
        WHERE genre_name IN (?, ?, ?, ?)`,
        [TEST_MOVIE_GENRE_1, TEST_MOVIE_GENRE_2, TEST_MOVIE_GENRE_3, TEST_MOVIE_GENRE_4]
    );
    await dbConnPool.execute(
        `DELETE FROM Movie
        WHERE title IN (?, ?, ?)`,
        [TEST_MOVIE_1_TITLE, TEST_MOVIE_2_TITLE, TEST_MOVIE_3_TITLE]
    );
    await dbConnPool.execute(
        `DELETE FROM MovieGenreCategory
        WHERE genre_name IN (?, ?, ?, ?)`,
        [TEST_MOVIE_GENRE_1, TEST_MOVIE_GENRE_2, TEST_MOVIE_GENRE_3, TEST_MOVIE_GENRE_4]
    );
}

beforeAll(async () => {
    try {
        await clearTestMovieData();
    
        // Movie
        const [res1] = await dbConnPool.execute(
            `INSERT INTO Movie (title, description, duration, poster_image, available) VALUES
            (?, "Test 1 desc", 1, ?, true)`,
            [TEST_MOVIE_1_TITLE, null]
        );
        testMovie1Id = res1.insertId;
        const [res2] = await dbConnPool.execute(
            `INSERT INTO Movie (title, description, duration, poster_image, available) VALUES
            (?, "Test 2 desc", 2, ?, true)`,
            [TEST_MOVIE_2_TITLE, null]
        );
        testMovie2Id = res2.insertId;
        const [res3] = await dbConnPool.execute(
            `INSERT INTO Movie (title, description, duration, poster_image, available) VALUES
            (?, "Test 3 desc", 3, ?, true)`,
            [TEST_MOVIE_3_TITLE, null]
        );
        testMovie3Id = res3.insertId;
        
        if (testMovie1Id === null || testMovie2Id === null || testMovie3Id === null) {
            throw `Test movie insert. 1Id:${testMovie1Id}, 2Id:${testMovie2Id}, 3Id:${testMovie3Id}`;
        }

        // Movie genre category
        await dbConnPool.execute(
            `INSERT INTO MovieGenreCategory (genre_name) VALUES
            (?), (?), (?), (?)`,
            [TEST_MOVIE_GENRE_1, TEST_MOVIE_GENRE_2, TEST_MOVIE_GENRE_3, TEST_MOVIE_GENRE_4]
        );

        // MovieGenre (Movie to Genre mapping)
        await dbConnPool.execute(
            `INSERT INTO MovieGenre (movie_id, genre_name) VALUES
            (?, ?),
            (?, ?),
            (?, ?),
            (?, ?),
            (?, ?)`,
            [testMovie1Id, TEST_MOVIE_GENRE_1, testMovie1Id, TEST_MOVIE_GENRE_4,
             testMovie2Id, TEST_MOVIE_GENRE_2,
             testMovie3Id, TEST_MOVIE_GENRE_3, testMovie3Id, TEST_MOVIE_GENRE_4
            ]
        );

    } catch (err) {
        throw `movie-endpoints test setup failed: ${err}`;
    }
});

afterAll(async () => {
    await clearTestMovieData();
    server.close();
});

describe('GET /movie?genre={genre}', () => {
    test("Retrieve all movies", async () => {
        const res = await request(app).get("/movie").send();
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie1Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie2Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie3Id)).toBe(true);
        
        // Check movie objects
        const movie1 = res.body.find(movie => movie.id === testMovie1Id);
        const movie2 = res.body.find(movie => movie.id === testMovie2Id);
        const movie3 = res.body.find(movie => movie.id === testMovie3Id);

        // Ensure titles are correct
        expect(movie1.title === TEST_MOVIE_1_TITLE).toBe(true);
        expect(movie2.title === TEST_MOVIE_2_TITLE).toBe(true);
        expect(movie3.title === TEST_MOVIE_3_TITLE).toBe(true);

        // Ensure all genres for each movie is returned
        expect(Array.isArray(movie1.genres)).toBe(true);
        expect(Array.isArray(movie2.genres)).toBe(true);
        expect(Array.isArray(movie3.genres)).toBe(true);

        expect(movie1.genres.length === 2).toBe(true);
        expect(movie2.genres.length === 1).toBe(true);
        expect(movie3.genres.length === 2).toBe(true);

        expect(movie1.genres.some(genre => genre === TEST_MOVIE_GENRE_1)).toBe(true);
        expect(movie1.genres.some(genre => genre === TEST_MOVIE_GENRE_4)).toBe(true);
        expect(movie2.genres.some(genre => genre === TEST_MOVIE_GENRE_2)).toBe(true);
        expect(movie3.genres.some(genre => genre === TEST_MOVIE_GENRE_3)).toBe(true);
        expect(movie3.genres.some(genre => genre === TEST_MOVIE_GENRE_4)).toBe(true);
    });
    
    test("Retrieve by genre - Single result", async () => {
        const res = await request(app).get(`/movie?genre=${TEST_MOVIE_GENRE_1}`).send();
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length === 1).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie1Id)).toBe(true);    
    });
    
    test("Retrieve by genre - Multiple results", async () => {
        const res = await request(app).get(`/movie?genre=${TEST_MOVIE_GENRE_4}`).send();
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length === 2).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie1Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie3Id)).toBe(true);
    });

    test("Retrieve by genre - Empty genre value acts like retrieving all", async () => {
        const res = await request(app).get(`/movie?genre=`).send();
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie1Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie2Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie3Id)).toBe(true);
    });
    
    test("Retrieve by genre - Bad genre value (unhappy path)", async () => {
        // Digit are not allowed in genres
        const res = await request(app).get(`/movie?genre=${TEST_MOVIE_GENRE_1}1`);
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ reason: "Invalid genre value" });
    });
});
