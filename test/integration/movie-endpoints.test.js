import bcrypt from "bcrypt";
import request from 'supertest';
import { login } from "./util.js";
import { dbConnPool } from '../../src/services/database.js';
import { app, server } from '../../src/app.js';

const TEST_MOVIE_1_TITLE = "Jest Movie 1";
const TEST_MOVIE_1_DESC  = "Test 1 desc";
const TEST_MOVIE_1_DUR   = 1;
const TEST_MOVIE_2_TITLE = "Jest Movie 2";
const TEST_MOVIE_3_TITLE = "Jest Movie 3";
const TEST_UNAVAILABLE_TITLE = "not to be shown in findAll and findByGenre";
const TEST_UNAVAILABLE_DESC  = "Should only be found via ID for historical reasons";
const TEST_UNAVAILABLE_DUR  = 4;
const TEST_MOVIE_GENRE_1 = "JestGenreOne";
const TEST_MOVIE_GENRE_2 = "JestGenreTwo";
const TEST_MOVIE_GENRE_3 = "JestGenreThree";
const TEST_MOVIE_GENRE_4 = "JestGenreFour";
var testMovie1Id = null;
var testMovie2Id = null;
var testMovie3Id = null;
var testMovieUnavailableId = null;

const ADMIN_EMAIL = "MovieTestAdmin@email.com";
const ADMIN_PASS = "MovieTestPass1";
const TEST_NEW_MOVIE_TITLE = "Test New Movie";
var testNewMovieId = null;

async function clearTestMovieData() {
    await dbConnPool.execute(  // First: Joins Movie and MovieGenreCategory
        `DELETE FROM MovieGenre
        WHERE genre_name IN (?, ?, ?, ?)`,
        [TEST_MOVIE_GENRE_1, TEST_MOVIE_GENRE_2, TEST_MOVIE_GENRE_3, TEST_MOVIE_GENRE_4]
    );
    await dbConnPool.execute(
        `DELETE FROM Movie
        WHERE title IN (?, ?, ?, ?, ?)`,
        [TEST_MOVIE_1_TITLE, TEST_MOVIE_2_TITLE, TEST_MOVIE_3_TITLE,
            TEST_UNAVAILABLE_TITLE, TEST_NEW_MOVIE_TITLE]
    );
    await dbConnPool.execute(
        `DELETE FROM MovieGenreCategory
        WHERE genre_name IN (?, ?, ?, ?)`,
        [TEST_MOVIE_GENRE_1, TEST_MOVIE_GENRE_2, TEST_MOVIE_GENRE_3, TEST_MOVIE_GENRE_4]
    );
    await dbConnPool.execute(
        `DELETE FROM User
        WHERE email_addr IN (?)`,
        [ADMIN_EMAIL]
    );
}

beforeAll(async () => {
    try {
        await clearTestMovieData();
    
        // Movie
        const [res1] = await dbConnPool.execute(
            `INSERT INTO Movie (title, description, duration, poster_image, available) VALUES
            (?, ?, ?, ?, true)`,
            [TEST_MOVIE_1_TITLE, TEST_MOVIE_1_DESC, TEST_MOVIE_1_DUR, null]
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
        const [res4] = await dbConnPool.execute(
            `INSERT INTO Movie (title, description, duration, poster_image, available) VALUES
            (?, ?, ?, ?, false)`,
            [TEST_UNAVAILABLE_TITLE, TEST_UNAVAILABLE_DESC, TEST_UNAVAILABLE_DUR, null]
        );
        testMovieUnavailableId = res4.insertId;

        const movieInsertFailed = testMovie1Id === null
            || testMovie2Id === null
            || testMovie3Id === null
            || testMovieUnavailableId === null;
        if (movieInsertFailed) {
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
            (?, ?),
            (?, ?)`,
            [testMovie1Id, TEST_MOVIE_GENRE_1, testMovie1Id, TEST_MOVIE_GENRE_4,
             testMovie2Id, TEST_MOVIE_GENRE_2,
             testMovie3Id, TEST_MOVIE_GENRE_3, testMovie3Id, TEST_MOVIE_GENRE_4,
             testMovieUnavailableId, TEST_MOVIE_GENRE_1
            ]
        );

        // Admin account
        const adminPassHash = bcrypt.hashSync(ADMIN_PASS, +process.env.PASSWORD_SALT_ROUNDS);
        await dbConnPool.execute(
            `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
                ("MovieTestAdmin", "MovieTestAdmin", ?, ?, 'admin')`,
            [ADMIN_EMAIL, adminPassHash]
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
    test("Retrieve all available movies", async () => {
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

        // Ensure non-available test movie is not seen here
        expect(res.body.some(movie => movie.id === testMovieUnavailableId)).toBe(false);
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

    test("Retrieve by genre - Empty genre value acts like retrieving all available", async () => {
        const res = await request(app).get(`/movie?genre=`).send();
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie1Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie2Id)).toBe(true);
        expect(res.body.some(movie => movie.id === testMovie3Id)).toBe(true);

        // Ensure non-available test movie is not seen here
        expect(res.body.some(movie => movie.id === testMovieUnavailableId)).toBe(false);
    });
    
    test("Retrieve by genre - Bad genre value (unhappy path)", async () => {
        // Digit are not allowed in genres
        const res = await request(app).get(`/movie?genre=${TEST_MOVIE_GENRE_1}1`);
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ reason: "Invalid genre value" });
    });
});

describe('GET /movie/{movie_id}', () => {
    test('Retrieve available', async () => {
        const res = await request(app).get(`/movie/${testMovie1Id}`).send();
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            title: TEST_MOVIE_1_TITLE,
            description: TEST_MOVIE_1_DESC,
            duration: TEST_MOVIE_1_DUR,
            poster: "TODO",
            genres: [ TEST_MOVIE_GENRE_4, TEST_MOVIE_GENRE_1 ]  // alphabetical order
        });
    });

    test('Retrieve unavailable (soft deleted)', async () => {
        const res = await request(app).get(`/movie/${testMovieUnavailableId}`).send();
        console.log(`testMovieUnavailableId: ${testMovieUnavailableId}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            title: TEST_UNAVAILABLE_TITLE,
            description: TEST_UNAVAILABLE_DESC,
            duration: TEST_UNAVAILABLE_DUR,
            poster: "TODO",
            genres: [ TEST_MOVIE_GENRE_1 ]
        });
    });
})

describe('Admin - POST, PUT, DELETE /movie endpoints', () => {
    test('Happy path - POST, PUT, then DELETE', async () => {
        const token = await login(ADMIN_EMAIL, ADMIN_PASS);
        expect(token).not.toBeNull();
    
        const postNewMovieRes = await request(app)
            .post(`/movie`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: TEST_NEW_MOVIE_TITLE,
                description: "Test New Movie Desc",
                duration: 1,
                genres: [ TEST_MOVIE_GENRE_1 ]
            });
        expect(postNewMovieRes.status).toBe(201);
        testNewMovieId = postNewMovieRes.body.id;
    
        const check1 = await request(app).get(`/movie`);
        expect(check1.status).toBe(200);
        expect(check1.body.some(movie => movie.id === testNewMovieId)).toBe(true);
        expect(check1.body.find(movie => movie.id === testNewMovieId).duration).toBe(1);
        expect(check1.body.find(movie => movie.id === testNewMovieId).duration).toBe(1);
    
        const putNewMovieRes = await request(app)
            .put(`/movie/${testNewMovieId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: TEST_NEW_MOVIE_TITLE,
                description: "Test New Movie Desc",
                duration: 2,
                genres: [ TEST_MOVIE_GENRE_1 ]
            });
        expect(putNewMovieRes.status).toBe(200);
        const check2 = await request(app).get(`/movie`);
        expect(check2.status).toBe(200);
        expect(check2.body.find(movie => movie.id === testNewMovieId).duration).toBe(2);
    
        const deleteNewMovieRes = await request(app)
            .delete(`/movie/${testNewMovieId}`)
            .set('Authorization', `Bearer ${token}`)
            .send();
        expect(deleteNewMovieRes.status).toBe(200);
    
        const check3 = await request(app).get(`/movie`);
        expect(check3.status).toBe(200);
        expect(check3.body.some(movie => movie.id === testNewMovieId)).toBe(false);
    });

    test('No auth', async () => {
        const postNoAuth = await request(app)
            .post(`/movie`)
            .send();
        expect(postNoAuth.status).toBe(401);
        
        const putNoAuth = await request(app)
            .put(`/movie/${testNewMovieId}`)
            .send();
        expect(putNoAuth.status).toBe(401);
        
        const deleteNoAuth = await request(app)
            .delete(`/movie/${testNewMovieId}`)
            .send();
        expect(deleteNoAuth.status).toBe(401);
    });

});
