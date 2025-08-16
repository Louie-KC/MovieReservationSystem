import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";
import { dbConnPool } from "../../src/services/database";
import { app, server } from "../../src/app.js";

const SCH_MOVIE_1_TITLE = "TEST SCH MOVIE 1";
const SCH_MOVIE_2_TITLE = "TEST SCH MOVIE 2";
const SCH_MOVIE_3_TITLE = "TEST SCH MOVIE 3";
var schMovie1Id = null;
var schMovie2Id = null;
var schMovie3Id = null;

const SCH_LOC_1_ADDR = "TEST SCH LOC 1";
var schLoc1Id = null;

const SCH_LOC_1_CINEMA_1_NAME = "TEST SCH LOC CINEMA 1";
const SCH_LOC_1_CINEMA_2_NAME = "TEST SCH LOC CINEMA 2";
var schLoc1Cin1Id = null;
var schLoc1Cin2Id = null;

var sch1Id = null;
var sch2Id = null;
var sch3Id = null;
var sch4Id = null;
var sch5Id = null;

var sch1Time = null;
var sch2Time = null;
var sch3Time = null;
var sch4Time = null;
var sch5Time = null;

const ADMIN_EMAIL = "ScheduleTestAdmin@email.com";
const ADMIN_PASSWORD = "TestPassword1";

const NON_ADMIN_EMAIL = "ScheduleTestNonAdmin@email.com";
const NON_ADMIN_PASSWORD = "TestPassword1";

async function clearTestScheduleData() {
    await dbConnPool.execute(
        `DELETE s
        FROM Schedule s
        INNER JOIN Movie m ON s.movie_id = m.id
        WHERE m.title IN (?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE]
    );

    await dbConnPool.execute(
        `DELETE FROM Cinema
        WHERE friendly_name IN (?, ?)`,
        [SCH_LOC_1_CINEMA_1_NAME, SCH_LOC_1_CINEMA_2_NAME]
    );

    await dbConnPool.execute(
        `DELETE FROM Location
        WHERE address IN (?)`,
        [SCH_LOC_1_ADDR]
    );

    await dbConnPool.execute(
        `DELETE FROM Movie
        WHERE title IN (?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE]
    );

    await dbConnPool.execute(
        `DELETE FROM User
        WHERE email_addr IN (?, ?)`,
        [ADMIN_EMAIL, NON_ADMIN_EMAIL]
    );
}

beforeAll(async () => {
        await clearTestScheduleData();
        
    // Test data - Movies to be scheduled
    const [movieResult1] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
            (?, 'Test Scheduled Movie 1 Desc', 1, true)`,
        [SCH_MOVIE_1_TITLE]
    );
    if (movieResult1.affectedRows !== 1) {
        throw "Failed to insert test movie 1"
    }
    const [movieResult2] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
        (?, 'Test Scheduled Movie 1 Desc', 1, true)`,
        [SCH_MOVIE_2_TITLE]
    );
    if (movieResult2.affectedRows !== 1) {
        throw "Failed to insert test movie 1"
    }
    const [movieResult3] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
        (?, 'Test Scheduled Movie 1 Desc', 1, true)`,
        [SCH_MOVIE_3_TITLE]
    );
    if (movieResult3.affectedRows !== 1) {
        throw "Failed to insert test movie 1"
    }
    
    // Test data - Location to schedule movies at
    const [locationResult] = await dbConnPool.execute(
        `INSERT INTO Location (address) VALUES (?)`,
        [SCH_LOC_1_ADDR]
    );
    if (locationResult.affectedRows !== 1) {
        throw "Failed to insert test location";
    }
    schLoc1Id = locationResult.insertId;
    
    // Test data - Cinema in location to schedule movies at
    const [cinemaResult1] = await dbConnPool.execute(
        `INSERT INTO Cinema (location_id, friendly_name) VALUES (?, ?)`,
        [schLoc1Id, SCH_LOC_1_CINEMA_1_NAME]
    );
    if (cinemaResult1.affectedRows !== 1) {
        throw "Failed to insert test cinema 1";
    }
    const [cinemaResult2] = await dbConnPool.execute(
        `INSERT INTO Cinema (location_id, friendly_name) VALUES (?, ?)`,
        [schLoc1Id, SCH_LOC_1_CINEMA_2_NAME]
    );
    if (cinemaResult2.affectedRows !== 1) {
        throw "Failed to insert test cinema 2";
    }

    schMovie1Id = movieResult1.insertId;
    schMovie2Id = movieResult2.insertId;
    schMovie3Id = movieResult3.insertId;
    schLoc1Cin1Id = cinemaResult1.insertId;
    schLoc1Cin2Id = cinemaResult2.insertId;

    // Test data - Schedules
    sch1Time = new Date().roundOutMs();
    const [scheduleResult1] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
            (?, ?, ?, FROM_UNIXTIME(?), true)`,
        [schMovie1Id, schLoc1Id, schLoc1Cin1Id, sch1Time.toEpochSec()]
    );
    if (scheduleResult1.affectedRows !== 1) {
        throw "Failed to insert test schedule 1";
    }
    sch2Time = new Date().roundOutMs().addHours(1);
    const [scheduleResult2] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
        (?, ?, ?, FROM_UNIXTIME(?), true)`,
        [schMovie1Id, schLoc1Id, schLoc1Cin1Id, sch2Time.toEpochSec()]
    );
    if (scheduleResult2.affectedRows !== 1) {
        throw "Failed to insert test schedule 2";
    }
    sch3Time = new Date().roundOutMs().addDays(1);
    const [scheduleResult3] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
        (?, ?, ?, FROM_UNIXTIME(?), true)`,
        [schMovie1Id, schLoc1Id, schLoc1Cin1Id, sch3Time.toEpochSec()]
    );
    if (scheduleResult3.affectedRows !== 1) {
        throw "Failed to insert test schedule 3";
    }
    
    sch4Time = new Date().roundOutMs();
    const [scheduleResult4] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
        (?, ?, ?, FROM_UNIXTIME(?), true)`,
        [schMovie2Id, schLoc1Id, schLoc1Cin2Id, sch4Time.toEpochSec()]
    );
    if (scheduleResult4.affectedRows !== 1) {
        throw "Failed to insert test schedule 4";
    }
    sch5Time = new Date().roundOutMs().addHours(1);
    const [scheduleResult5] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
            (?, ?, ?, FROM_UNIXTIME(?), true)`,
        [schMovie3Id, schLoc1Id, schLoc1Cin2Id, sch5Time.toEpochSec()]
    );
    if (scheduleResult5.affectedRows !== 1) {
        throw "Failed to insert test schedule 5";
    }

    sch1Id = scheduleResult1.insertId;
    sch2Id = scheduleResult2.insertId;
    sch3Id = scheduleResult3.insertId;
    sch4Id = scheduleResult4.insertId;
    sch5Id = scheduleResult5.insertId;

    const adminPassHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    const [testAdminResult1] = await dbConnPool.execute(
        `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
            ('SchAdminGiven', 'SchAdminLast', ?, ?, 'admin')`,
        [ADMIN_EMAIL, adminPassHash]
    );
    if (testAdminResult1.affectedRows !== 1) {
        throw "Failed to insert test admin user";
    }
    
    const userPassHash = bcrypt.hashSync(NON_ADMIN_PASSWORD, 10);
    const [testUserResult1] = await dbConnPool.execute(
        `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
            ('SchUserGiven', 'SchUserLast', ?, ?, 'Customer')`,
        [NON_ADMIN_EMAIL, userPassHash]
    );
    if (testUserResult1.affectedRows !== 1) {
        throw "Failed to insert test non-admin user";
    }
});

afterAll(async () => {
    await clearTestScheduleData();
    server.close();
});

test("GET /schedule/{schedule_id} - Happy path", async () => {
    const res = await request(app).get(`/schedule/${sch1Id}`).send();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        address: SCH_LOC_1_ADDR,
        cinema: SCH_LOC_1_CINEMA_1_NAME,
        title: SCH_MOVIE_1_TITLE,
        "TODO: poster": "TODO: poster",
        time: sch1Time.toISOString()
    });
});

test("GET /schedule/{schedule_id} - No schedule with schedule_id", async () => {
    const res = await request(app).get(`/schedule/0`).send();
    expect(res.status).toBe(404);
});

test("GET /schedule/{schedule_id} - Invalid schedule_id format", async () => {
    const res = await request(app).get(`/schedule/abc`).send();
    expect(res.status).toBe(400);
});

test("GET /schedule/{location_id}/{cinema_id}?date - Happy path", async () => {
    // login
    const loginRes = await request(app).post('/account/login').send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    expect(loginRes.status).toBe(200);
    const adminJWT = loginRes.body.token;

    // Loc 1 Cinema 1
    const today = new Date().toISODateOnly();
    const todaySchedules = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${today}`)
        .set('Authorization', `Bearer ${adminJWT}`);
    expect(todaySchedules.status).toBe(200);
    expect(todaySchedules.body.filter(sch => sch.title === SCH_MOVIE_1_TITLE).length).toBe(2);

    const tomorrow = new Date().addDays(1).toISODateOnly();
    const tomorrowSchedules = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${tomorrow}`)
        .set('Authorization', `Bearer ${adminJWT}`);
    
    expect(tomorrowSchedules.status).toBe(200);
    expect(tomorrowSchedules.body.filter(sch => sch.title === SCH_MOVIE_1_TITLE).length).toBe(1);
    expect(tomorrowSchedules.body.find(sch => sch.title === SCH_MOVIE_1_TITLE).id).toBe(sch3Id);

    // Loc 1 Cinema 2
    const cin2 = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin2Id}?date=${today}`)
        .set('Authorization', `Bearer ${adminJWT}`);
    expect(cin2.status).toBe(200);
    expect(cin2.body.find(sch => sch.title === SCH_MOVIE_2_TITLE).id).toBe(sch4Id);
    expect(cin2.body.find(sch => sch.title === SCH_MOVIE_3_TITLE).id).toBe(sch5Id);
});


test("GET /schedule/{location_id}/{cinema_id}?date - Bad authorisation", async () => {
    const adminLoginRes = await request(app).post('/account/login').send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    expect(adminLoginRes.status).toBe(200);
    const adminJWT = adminLoginRes.body.token;

    const nonAdminLoginRes = await request(app).post('/account/login').send({
        email: NON_ADMIN_EMAIL,
        password: NON_ADMIN_PASSWORD
    });
    expect(nonAdminLoginRes.status).toBe(200);
    const nonAdminJWT = nonAdminLoginRes.body.token;

    const today = new Date().toISODateOnly();

    const noAuth = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${today}`);
    expect(noAuth.status).toBe(400);

    const missingBearerPrefix = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${today}`)
        .set('Authorization', `${adminJWT}`);
    expect(missingBearerPrefix.status).toBe(400);
    
    const madeUpJwt = jwt.sign({ userId: 0, email: "abcd@email.com"}, "TestSecret", { expiresIn: "1m"});
    const madeUpJwtAuth = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${today}`)
        .set('Authorization', `Bearer ${madeUpJwt}`);
    expect(madeUpJwtAuth.status).toBe(401);
        
    const nonAdmin = await request(app)
        .get(`/schedule/${schLoc1Id}/${schLoc1Cin1Id}?date=${today}`)
        .set('Authorization', `Bearer ${nonAdminJWT}`);
    expect(nonAdmin.status).toBe(401);
});
