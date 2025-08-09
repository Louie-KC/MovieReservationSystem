import request from 'supertest';
import { dbConnPool } from '../../src/services/database.js';
import { app, server } from '../../src/app.js';

const LOCATION_1_ADDRESS = "Test Location 1 Address";
const LOCATION_2_ADDRESS = "Test Location 2 Address";
const LOCATION_3_ADDRESS = "Test Location 3 Address";
var location1Id = null;
var location2Id = null;
var location3Id = null;

async function clearTestLocationData() {
    await dbConnPool.execute(
        `DELETE FROM Location
        WHERE address IN (?, ?, ?)`,
        [LOCATION_1_ADDRESS, LOCATION_2_ADDRESS, LOCATION_3_ADDRESS]
    );
}

beforeAll(async () => {
    try {
        await clearTestLocationData();
        const res1 = await dbConnPool.execute(
            `INSERT INTO Location (address) VALUES (?)`,
            [LOCATION_1_ADDRESS]
        );
        location1Id = res1.insertId;
        const res2 = await dbConnPool.execute(
            `INSERT INTO Location (address) VALUES (?)`,
            [LOCATION_2_ADDRESS]
        );
        location2Id = res2.insertId;
        const res3 = await dbConnPool.execute(
            `INSERT INTO Location (address) VALUES (?)`,
            [LOCATION_3_ADDRESS]
        );
        location3Id = res3.insertId;

    } catch (err) {
        throw `movie-endpoints test setup failed: ${err}`;
    }
});

afterAll(async () => {
    await clearTestLocationData();
    server.close();
});

test("GET /location", async () => {
    const res = await request(app).get("/location").send();
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(item => item.id === location1Id));
    expect(res.body.some(item => item.id === location2Id));
    expect(res.body.some(item => item.id === location3Id));
});
