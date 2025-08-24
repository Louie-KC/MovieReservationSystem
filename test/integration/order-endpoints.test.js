import bcrypt from "bcrypt";
import request from "supertest";
import { dbConnPool } from "../../src/services/database";
import { app, server } from "../../src/app.js";

const ORDER_MOVIE_1_TITLE = "TEST ORDER MOVIE 1";
var orderMovie1Id = null;

const ORDER_LOC_1_ADDR = "TEST ORDER LOC 1";
var orderLoc1Id = null;

const ORDER_LOC_1_CINEMA_1_NAME = "TEST ORDER LOC CIN 1";
var orderLoc1Cin1Id = null;

const L1_C1_SEAT_ROW_MIN = 'A'.charCodeAt(0);
const L1_C1_SEAT_ROW_MAX = 'E'.charCodeAt(0);
const L1_C1_SEAT_NUM_MIN = 1;
const L1_C1_SEAT_NUM_MAX = 10;

var orderSchId1 = null;
var orderSchTime1 = null;

const USER_1_EMAIL = "OrderTestUser1@email.com";
const USER_1_PASS = "TestPassword1";
const USER_2_EMAIL = "OrderTestUser2@email.com";
const USER_2_PASS = "TestPassword2";

async function clearTestData() {
    await dbConnPool.execute(
        `DELETE rs
        FROM ReservationSeat rs
        INNER JOIN Reservation r ON rs.reservation_id = r.id
        INNER JOIN User u ON r.user_id = u.id
        WHERE u.email_addr IN (?, ?)`,
        [USER_1_EMAIL, USER_2_EMAIL]
    );

    await dbConnPool.execute(
        `DELETE r
        FROM Reservation r
        INNER JOIN User u ON r.user_id = u.id
        WHERE u.email_addr IN (?, ?)`,
        [USER_1_EMAIL, USER_2_EMAIL]
    );

    await dbConnPool.execute(
        `DELETE FROM User
        WHERE email_addr IN (?, ?)`,
        [USER_1_EMAIL, USER_2_EMAIL]
    );

    await dbConnPool.execute(
        `DELETE s
        FROM Schedule s
        INNER JOIN Movie m ON s.movie_id = m.id
        WHERE m.title IN (?)`,
        [ORDER_MOVIE_1_TITLE]
    );

    await dbConnPool.execute(
        `DELETE FROM Movie
        WHERE title IN (?)`,
        [ORDER_MOVIE_1_TITLE]
    );

    await dbConnPool.execute(
        `DELETE cs
        FROM CinemaSeat cs
        INNER JOIN Cinema c ON cs.cinema_id = c.id AND cs.location_id = c.location_id
        WHERE c.friendly_name IN (?)`,
        [ORDER_LOC_1_CINEMA_1_NAME]
    );

    await dbConnPool.execute(
        `DELETE FROM Cinema
        WHERE friendly_name IN (?)`,
        [ORDER_LOC_1_CINEMA_1_NAME]
    );

    await dbConnPool.execute(
        `DELETE FROM Location
        WHERE address IN (?)`,
        [ORDER_LOC_1_ADDR]
    );
}

beforeAll(async () => {
    await clearTestData();

    const user1PassHash = bcrypt.hashSync(USER_1_PASS, +process.env.PASSWORD_SALT_ROUNDS);
    const [user1Res] = await dbConnPool.execute(
        `INSERT INTO User (given_name, last_name, email_addr, password_hash) VALUES
            ("ordertestcust1given", "ordertestcust1last", ?, ?)`,
        [USER_1_EMAIL, user1PassHash]
    );
    if (user1Res.affectedRows !== 1) {
        throw "Customer 1 failed to be inserted";
    }
    const user2PassHash = bcrypt.hashSync(USER_2_PASS, +process.env.PASSWORD_SALT_ROUNDS);
    const [user2Res] = await dbConnPool.execute(
        `INSERT INTO User (given_name, last_name, email_addr, password_hash) VALUES
            ("ordertestcust1given", "ordertestcust1last", ?, ?)`,
        [USER_2_EMAIL, user2PassHash]
    );
    if (user2Res.affectedRows !== 1) {
        throw "Customer 2 failed to be inserted";
    }

    const [movie1Res] = await dbConnPool.execute(
        `INSERT INTO Movie (title, description, duration, available) VALUES
            (?, "Test Order Movie 1 Desc", 1, true)`,
        [ORDER_MOVIE_1_TITLE]
    );
    if (movie1Res.affectedRows !== 1) {
        throw "Movie 1 failed to be inserted";
    }
    orderMovie1Id = movie1Res.insertId;

    const [loc1Res] = await dbConnPool.execute(
        `INSERT INTO Location (address) VALUES (?)`,
        [ORDER_LOC_1_ADDR]
    );
    if (loc1Res.affectedRows !== 1) {
        throw "Location 1 failed to be inserted";
    }
    orderLoc1Id = loc1Res.insertId;

    const [loc1Cin1Res] = await dbConnPool.execute(
        `INSERT INTO Cinema (location_id, friendly_name) VALUES
            (?, ?)`,
        [orderLoc1Id, ORDER_LOC_1_CINEMA_1_NAME]
    );
    if (loc1Cin1Res.affectedRows !== 1) {
        throw "Location 1 Cinema 1 failed to be inserted";
    }
    orderLoc1Cin1Id = loc1Cin1Res.insertId;

    for (var row = L1_C1_SEAT_ROW_MIN; row <= L1_C1_SEAT_ROW_MAX; row++) {
        for (var num = L1_C1_SEAT_NUM_MIN; num <= L1_C1_SEAT_NUM_MAX; num++) {
            const rowStr = String.fromCharCode(row);
            const [seatInsertRes] = await dbConnPool.execute(
                `INSERT INTO CinemaSeat (cinema_id, location_id, seat_row, seat_number, kind)
                VALUES (?, ?, ?, ?, 'regular')`,
                [orderLoc1Cin1Id, orderLoc1Id, rowStr, num]
            );
            if (seatInsertRes.affectedRows !== 1) {
                throw `Failed to insert seat ${rowStr}${col} to loc 1 cin 1`;
            }
        }
    }

    orderSchTime1 = new Date().addHours(1).roundOutMs();
    const [sch1Result] = await dbConnPool.execute(
        `INSERT INTO Schedule (movie_id, location_id, cinema_id, start_time, available) VALUES
            (?, ?, ?, FROM_UNIXTIME(?), true)`,
            [orderMovie1Id, orderLoc1Id, orderLoc1Cin1Id, orderSchTime1.toEpochSec()]
    );
    if (sch1Result.affectedRows !== 1) {
        throw "Failed to insert schedule 1";
    }
    orderSchId1 = sch1Result.insertId;
});

afterAll(async () => {
    await clearTestData();
    server.close();
});

test("GET /order/history - No orders/reservations", async () => {
    const loginRes = await request(app).post("/account/login").send({
        email: USER_1_EMAIL,
        password: USER_1_PASS
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const historyRes = await request(app).get("/order/history")
        .set("Authorization", `Bearer ${token}`)
        .send();
    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body)).toBe(true);
    expect(historyRes.body.length).toBe(0);
});

test("POST /order/reserve - Reserve single seat (A1)", async () => {
    const loginRes = await request(app).post("/account/login").send({
        email: USER_2_EMAIL,
        password: USER_2_PASS
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const reserveRes = await request(app).post("/order/reserve")
        .set("Authorization", `Bearer ${token}`)
        .send({
            schedule: orderSchId1,
            seats: [ "A1" ]
        });
    expect(reserveRes.status).toBe(200);
});

test("POST /order/reserve - Reserve multiple seats (A2, A3)", async () => {
    const loginRes = await request(app).post("/account/login").send({
        email: USER_2_EMAIL,
        password: USER_2_PASS
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const reserveRes = await request(app).post("/order/reserve")
        .set("Authorization", `Bearer ${token}`)
        .send({
            schedule: orderSchId1,
            seats: [ "A2", "A3" ]
        });
    expect(reserveRes.status).toBe(200);
});

test("POST /order/reserve - Invalid no seats", async () => {
    const loginRes = await request(app).post("/account/login").send({
        email: USER_2_EMAIL,
        password: USER_2_PASS
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const reserveRes = await request(app).post("/order/reserve")
        .set("Authorization", `Bearer ${token}`)
        .send({
            schedule: orderSchId1,
            seats: []
        });
    expect(reserveRes.status).toBe(400);
    expect(reserveRes.body).toEqual({ reason: "Invalid reserve body" });
});

test("POST /order/reserve - Invalid bad seat", async () => {
    const loginRes = await request(app).post("/account/login").send({
        email: USER_2_EMAIL,
        password: USER_2_PASS
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const reserveRes = await request(app).post("/order/reserve")
        .set("Authorization", `Bearer ${token}`)
        .send({
            schedule: orderSchId1,
            seats: [ "Z1" ]  // test data only goes up to row E
        });
    expect(reserveRes.status).toBe(400);
});

test("POST /order/reserve - Bad auth", async () => {
    const noAuth = await request(app).post("/order/reserve")
        .send({
            schedule: orderSchId1,
            seats: [ "A1" ]
        });
    expect(noAuth.status).toBe(401);

    const badAuth = await request(app).post("/order/reserve")
        .set("Authorization", `Bearer asdklasjdlk`)
        .send({
            schedule: orderSchId1,
            seats: [ "A1" ]
        });
    expect(badAuth.status).toBe(401);
});

test("GET /order/history - Bad auth", async () => {
    const noAuth = await request(app).get("/order/history").send();
    expect(noAuth.status).toBe(401);

    const badAuth = await request(app).get("/order/history")
        .set("Authorization", `Bearer asdklasjdlk`)
        .send();
    expect(badAuth.status).toBe(401);
});

test("GET /order/confirm - Bad auth", async () => {
    const noAuth = await request(app).post("/order/confirm").send({ id: 1 });
    expect(noAuth.status).toBe(401);

    const badAuth = await request(app).post("/order/confirm")
        .set("Authorization", `Bearer asdklasjdlk`)
        .send({ id: 1 });
    expect(badAuth.status).toBe(401);
});

test("GET /order/cancel - Bad auth", async () => {
    const noAuth = await request(app).post("/order/cancel").send({ id: 1 });
    expect(noAuth.status).toBe(401);

    const badAuth = await request(app).post("/order/cancel")
        .set("Authorization", `Bearer asdklasjdlk`)
        .send({ id: 1 });
    expect(badAuth.status).toBe(401);
});
