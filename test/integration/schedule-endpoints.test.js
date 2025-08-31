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

const SCH_MOVIE_ADMIN_TITLE = "TEST SCH MOVIE FOR ADMIN TEST"
var schMovieAdminId = null;

const SCH_LOC_1_ADDR = "TEST SCH LOC 1";
var schLoc1Id = null;

const SCH_LOC_1_CINEMA_1_NAME = "TEST SCH LOC CINEMA 1";
const SCH_LOC_1_CINEMA_2_NAME = "TEST SCH LOC CINEMA 2";
var schLoc1Cin1Id = null;
var schLoc1Cin2Id = null;

const schL1C1SeatRowMin = 'A'.charCodeAt(0);
const schL1C1SeatRowMax = 'E'.charCodeAt(0);
const schL1C1SeatColMin = 1;
const schL1C1SeatColMax = 10;

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
        `DELETE rs
        FROM ReservationSeat rs
        INNER JOIN Reservation r ON rs.reservation_id = r.id
        INNER JOIN Schedule s ON r.schedule_id = s.id
        INNER JOIN Movie m ON s.movie_id = m.id
        WHERE m.title IN (?, ?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE, SCH_MOVIE_ADMIN_TITLE]
    );

    await dbConnPool.execute(
        `DELETE r
        FROM Reservation r
        INNER JOIN Schedule s ON r.schedule_id = s.id
        INNER JOIN Movie m ON s.movie_id = m.id
        WHERE m.title IN (?, ?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE, SCH_MOVIE_ADMIN_TITLE]
    );

    await dbConnPool.execute(
        `DELETE s
        FROM Schedule s
        INNER JOIN Movie m ON s.movie_id = m.id
        WHERE m.title IN (?, ?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE, SCH_MOVIE_ADMIN_TITLE]
    );

    await dbConnPool.execute(
        `DELETE cs
        FROM CinemaSeat cs
        INNER JOIN Cinema c ON cs.cinema_id = c.id
        WHERE c.friendly_name IN (?)`,
        [SCH_LOC_1_CINEMA_1_NAME]
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
        WHERE title IN (?, ?, ?, ?)`,
        [SCH_MOVIE_1_TITLE, SCH_MOVIE_2_TITLE, SCH_MOVIE_3_TITLE, SCH_MOVIE_ADMIN_TITLE]
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
        throw "Failed to insert test movie 2"
    }
    const [movieResult3] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
        (?, 'Test Scheduled Movie 1 Desc', 1, true)`,
        [SCH_MOVIE_3_TITLE]
    );
    if (movieResult3.affectedRows !== 1) {
        throw "Failed to insert test movie 3"
    }
    const [adminMovieResult] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
        (?, 'Admin schedule endpoint test', 1, true)`,
        [SCH_MOVIE_ADMIN_TITLE]
    );
    if (adminMovieResult.affectedRows !== 1) {
        throw "Failed to insert test movie admin"
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

    schMovieAdminId = adminMovieResult.insertId;

    // Test data - Seats for Location 1 Cinema 1
    for (var row = schL1C1SeatRowMin; row <= schL1C1SeatRowMax; row++) {
        for (var col = schL1C1SeatColMin; col <= schL1C1SeatColMax; col++) {
            const rowString = String.fromCharCode(row);
            const [seatInsertRes] = await dbConnPool.execute(
                `INSERT INTO CinemaSeat (cinema_id, location_id, seat_row, seat_number, kind)
                VALUES (?, ?, ?, ?, 'regular')`,
                [schLoc1Cin1Id, schLoc1Id, rowString, col]
            );
            if (seatInsertRes.affectedRows !== 1) {
                throw `Failed to insert seat ${rowString}${col} to loc 1 cin 1`
            }
        }
    }

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

    // Test existing reservations to ensure seat availability is correct
    const [confirmedReservationInsertResult] = await dbConnPool.execute(
        `INSERT INTO Reservation (schedule_id, kind, last_updated) VALUES
            (?, 'confirmed', NOW())`,
        [sch1Id]
    );
    if (confirmedReservationInsertResult.affectedRows !== 1) {
        throw "Failed to insert confirmed reservation cin 1 loc 1 sch 1";
    }
    const confirmedReservationId = confirmedReservationInsertResult.insertId;
    const [confirmedReservSeatInsertResult] = await dbConnPool.execute(
        `INSERT INTO ReservationSeat (reservation_id, seat_id) VALUES (?, (
            SELECT cs.id
            FROM CinemaSeat cs
            WHERE cs.cinema_id = ?
            AND cs.location_id = ?
            AND cs.seat_row = 'A'
            AND cs.seat_number = 1
        ))`,
        [confirmedReservationId, schLoc1Cin1Id, schLoc1Id]
    );
    if (confirmedReservSeatInsertResult.affectedRows !== 1) {
        throw "Failed to insert seat for confirmed reservation cin 1 loc 1 sch 1";
    }

    const [tentativeReservationInsertResult] = await dbConnPool.execute(
        `INSERT INTO Reservation (user_id, schedule_id, kind, last_updated) VALUES
            (NULL, ?, 'tentative', NOW())`,
        [sch1Id]
    );
    if (tentativeReservationInsertResult.affectedRows !== 1) {
        throw "Failed to insert tentative reservation cin 1 loc 1 sch 1";
    }
    const tentativeReservationId = tentativeReservationInsertResult.insertId;
    const [tentativeReservSeatInsertResult] = await dbConnPool.execute(
        `INSERT INTO ReservationSeat (reservation_id, seat_id) VALUES (?, (
            SELECT cs.id
            FROM CinemaSeat cs
            WHERE cs.cinema_id = ?
            AND cs.location_id = ?
            AND cs.seat_row = 'A'
            AND cs.seat_number = 2
        ))`,
        [tentativeReservationId, schLoc1Cin1Id, schLoc1Id]
    );
    if (tentativeReservSeatInsertResult.affectedRows !== 1) {
        throw "Failed to insert seat for tentative reservation cin 1 loc 1 sch 1";
    }

    // Test accounts
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

describe("GET /schedule?location&date", () => {
    test("Specified date", async () => {
        const today = new Date().roundOutMs().toISODateOnly();
        const tomorrow = new Date().addDays(1).toISODateOnly();
        const epochStart = "1970-01-01";

        // sch1 : current time
        // sch2 : current time + 1 hr
        // sch3 : tomorrow
        // sch4 : current time
        // sch5 : current time + 1 hr

        const todayRes = await request(app)
            .get(`/schedule?location=${schLoc1Id}&date=${today}`)
            .send();
        expect(todayRes.status).toBe(200);
        expect(Array.isArray(todayRes.body)).toBe(true);
        expect(todayRes.body.some(schd => schd.id === sch1Id)).toBe(true);  // now
        expect(todayRes.body.some(schd => schd.id === sch3Id)).toBe(false); // tomorrow
        expect(todayRes.body.some(schd => schd.id === sch4Id)).toBe(true);  // now

        const tomorrowRes = await request(app)
            .get(`/schedule?location=${schLoc1Id}&date=${tomorrow}`)
            .send();
        expect(tomorrowRes.status).toBe(200);
        expect(Array.isArray(tomorrowRes.body)).toBe(true);
        expect(tomorrowRes.body.some(schd => schd.id === sch1Id)).toBe(false);
        expect(tomorrowRes.body.some(schd => schd.id === sch3Id)).toBe(true);
        expect(tomorrowRes.body.some(schd => schd.id === sch4Id)).toBe(false);

        const epochRes = await request(app)
            .get(`/schedule?location=${schLoc1Id}&date=${epochStart}`)
            .send();
        expect(epochRes.status).toBe(200);
        expect(Array.isArray(epochRes.body)).toBe(true);
        expect(epochRes.body.some(schd => schd.id === sch1Id)).toBe(false);
        expect(epochRes.body.some(schd => schd.id === sch2Id)).toBe(false);
        expect(epochRes.body.some(schd => schd.id === sch3Id)).toBe(false);
        expect(epochRes.body.some(schd => schd.id === sch4Id)).toBe(false);
        expect(epochRes.body.some(schd => schd.id === sch5Id)).toBe(false);
    });

    test("Unspecified date assumes today/the current date", async () => {
        const today = new Date().roundOutMs().toISODateOnly();
        const specifiedRes = await request(app)
            .get(`/schedule?location=${schLoc1Id}&date=${today}`)
            .send();
        
        const unspecifiedRes = await request(app)
            .get(`/schedule?location=${schLoc1Id}`)
            .send();

        expect(specifiedRes.status).toBe(200);
        expect(unspecifiedRes.status).toBe(200);
        expect(unspecifiedRes.body).toEqual(specifiedRes.body);
    });

    test("Invalid query params", async () => {
        const noParams = await request(app).get(`/schedule`).send();
        expect(noParams.status).toBe(400);

        const noLocation = await request(app).get(`/schedule?date=2025-08-31`).send();
        expect(noLocation.status).toBe(400);

        const badLocation = await request(app).get(`/schedule?location=1bc4`).send();
        expect(badLocation.status).toBe(400);

        const badDate1 = await request(app).get(`/schedule?location=${schLoc1Id}&date=2025-08`);
        expect(badDate1.status).toBe(400);

        const badDate2 = await request(app).get(`/schedule?location=${schLoc1Id}&date=25-08-31`);
        expect(badDate2.status).toBe(400);

        const badDate3 = await request(app).get(`/schedule?location=${schLoc1Id}&date=ab;cd`);
        expect(badDate3.status).toBe(400);
    });
});

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

test("GET /schedule/{schedule_id}/seats", async () => {
    const res = await request(app).get(`/schedule/${sch1Id}/seats`).send();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const seatA1 = res.body.find(seatObj => seatObj.seat === "A1");  // reserved confirmed
    const seatA2 = res.body.find(seatObj => seatObj.seat === "A2");  // reserved tentative
    const seatA3 = res.body.find(seatObj => seatObj.seat === "A3");  // not reserved
    expect(seatA1).toEqual({ seat: "A1", available: false });
    expect(seatA2).toEqual({ seat: "A2", available: false });
    expect(seatA3).toEqual({ seat: "A3", available: true });
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

describe(`Admin - POST, PUT, DELETE /schedule endpoints`, () => {
    test('Happy path - POST, PUT then DELETE', async () => {
        const loginRes = await request(app)
            .post('/account/login')
            .send({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.token;

        const time1Str = new Date()
            .addDays(1)
            .roundOutMs()
            .toISOString()
            .split('.')[0]
            .replace('T', ' ');
        const postNewScheduleRes = await request(app)
            .post('/schedule')
            .set('Authorization', `Bearer ${token}`)
            .send({
                movie: schMovieAdminId,
                location: schLoc1Id,
                cinema: schLoc1Cin2Id,
                time: time1Str
            });
        expect(postNewScheduleRes.status).toBe(201);
        const scheduleId = postNewScheduleRes.body.id;

        // TODO: Get schedule list & verify schedule item exists

        const time2Str = new Date()
            .addDays(1)
            .addHours(1)  // TODO: May move onto next day
            .roundOutMs()
            .toISOString()
            .split('.')[0]
            .replace('T', ' ');
        const putUpdateScheduleRes = await request(app)
            .put(`/schedule/${scheduleId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                movie: schMovieAdminId,
                location: schLoc1Id,
                cinema: schLoc1Cin2Id,
                time: time2Str
            });
        expect(putUpdateScheduleRes.status).toBe(200);

        // TODO: Get schedule list & verify time has changed

        const deleteScheduleRes = await request(app)
            .delete(`/schedule/${scheduleId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(deleteScheduleRes.status).toBe(200);

        // TODO: Get schedule list & verify no longer available
    });
});
