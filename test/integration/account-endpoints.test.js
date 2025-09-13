import bcrypt from "bcrypt";
import request from 'supertest';
import { dbConnPool } from '../../src/services/database.js';
import { app, server } from '../../src/app.js';
import { login } from "./util.js";

const REGO_TEST_GOOD_EMAIL = "integration-rego-test@email.com";
const REGO_TEST_BAD_EMAIL = "integration-bad-rego-test@email.com";
const CUSTOMER_1_TEST_EMAIL = "integration-customer1-test@email.com";
const CUSTOMER_1_TEST_PASS_1 = "TestPassword321";
const CUSTOMER_1_TEST_PASS_2 = "TestPassword123";
const CUSTOMER_1_TEST_GIVEN = "TestCustomerOneGiven";
const CUSTOMER_2_TEST_EMAIL = "integrationCustomer2Test@email.com";
const CUSTOMER_2_TEST_PASS = "TestPassword5";
const ADMIN_TEST_EMAIL = "integration-test-account-admin@email.com";
const ADMIN_TEST_PASS = "TestPassword6";
const ADMIN_PROMOTEE_EMAIL = "integration-test-account-promotee@email.com";
const ADMIN_PROMOTEE_PASS = "TestPassword7";

var customer1Id = null;  // for admin GET /account/{account_id} test
var customer2Id = null;  // for admin GET /account/{account_id} test
var adminPromoteeId = null;

async function clearTestUserData() {
    await dbConnPool.execute(
        `DELETE FROM User
        WHERE email_addr IN (?, ?, ?, ?, ?, ?)`,
        [REGO_TEST_GOOD_EMAIL, REGO_TEST_BAD_EMAIL,
            CUSTOMER_1_TEST_EMAIL, CUSTOMER_2_TEST_EMAIL,
            ADMIN_TEST_EMAIL, ADMIN_PROMOTEE_EMAIL]
    );
}

beforeAll(async () => {
    try {
        await clearTestUserData();

        const customer1PassHash = bcrypt.hashSync(CUSTOMER_1_TEST_PASS_1, 10);
        const [result1] = await dbConnPool.execute(
            `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
            (?, "testcustomer1last", ?, ?, "customer")`,
            [CUSTOMER_1_TEST_GIVEN, CUSTOMER_1_TEST_EMAIL, customer1PassHash]
        );
        if (result1.affectedRows !== 1) {
            throw "Customer 1 failed to be inserted"
        };
        customer1Id = result1.insertId;

        const customer2PassHash = bcrypt.hashSync(CUSTOMER_2_TEST_PASS, 10);
        const [result2] = await dbConnPool.execute(
            `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
            ("testcustomer2given", "testcustomer2last", ?, ?, "customer")`,
            [CUSTOMER_2_TEST_EMAIL, customer2PassHash]
        );
        if (result2.affectedRows !== 1) {
            throw "Customer 2 failed to be inserted"
        };
        customer2Id = result2.insertId;

        const adminPassHash = bcrypt.hashSync(ADMIN_TEST_PASS, 10);
        const [result3] = await dbConnPool.execute(
            `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
                ("testAdminGiven", "testAdminLast", ?, ?, "admin")`,
            [ADMIN_TEST_EMAIL, adminPassHash]
        );
        if (result3.affectedRows !== 1) {
            throw "Admin failed to be inserted";
        }
        const adminPromoteePassHash = bcrypt.hashSync(ADMIN_PROMOTEE_PASS, 10);
        const [result4] = await dbConnPool.execute(
            `INSERT INTO User (given_name, last_name, email_addr, password_hash, kind) VALUES
                ("testAdminPromoteeGiven", "testAdminPromoteeLast", ?, ?, "customer")`,
            [ADMIN_PROMOTEE_EMAIL, adminPromoteePassHash]
        );
        if (result4.affectedRows !== 1) {
            throw "Admin promotee failed to be inserted";
        }
        adminPromoteeId = result4.insertId;
    } catch (err) {
        throw `account-endpoints test setup failed: ${err}`;
    }
});

afterAll(async () => {
    await clearTestUserData();
    server.close();
});

describe('Account Registration', () => {
    test("POST /account/register - happy path", async () => {
        const res = await request(app).post("/account/register").send({
            "given_name": "jest",
            "last_name": "test",
            "email": REGO_TEST_GOOD_EMAIL,
            "password": "TestPassword1"
        });
        expect(res.status).toBe(200);
    });
    
    test("POST /account/register - Invalid body", async () => {
        const missingField = await request(app).post("/account/register").send({
            "given_name": "jest",
            "email": REGO_TEST_BAD_EMAIL,
            "password": "TestPassword1"
        });
        expect(missingField.status).toBe(400);
        expect(missingField.body).toEqual({ reason: "Invalid registration body" });
        
        const tooShortPassword = await request(app).post("/account/register").send({
            "given_name": "jest",
            "last_name": "test",
            "email": REGO_TEST_BAD_EMAIL,
            "password": "Tes"
        });
        expect(tooShortPassword.status).toBe(400);
        expect(tooShortPassword.body).toEqual({ reason: "Invalid registration body" });
    });
    
    test("POST /account/register - Email already in use", async () => {
        const emailAlreadyTaken = await request(app).post("/account/register").send({
            "given_name": "jest",
            "last_name": "test",
            "email": CUSTOMER_1_TEST_EMAIL,  // See beforeAll()
            "password": "TestPassword1"
        });
        expect(emailAlreadyTaken.status).toBe(400);
        expect(emailAlreadyTaken.body).toEqual({ reason: "Email address already in use" });
    });
});

describe('Account Login', () => {
    test("POST /account/login - Happy path (as customer 2)", async () => {
        const res = await request(app).post("/account/login").send({
            "email": CUSTOMER_2_TEST_EMAIL,
            "password": CUSTOMER_2_TEST_PASS
        });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.token).not.toBe(0);
    });

    test("POST /account/login - Missing field", async () => {
        const res = await request(app).post("/account/login").send({
            "email": CUSTOMER_2_TEST_EMAIL,
        });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ reason: "Invalid login body" });
    });

    test("POST /account/login - Non-existant email", async () => {
        const res = await request(app).post("/account/login").send({
            "email": "non-existant-email@fake.com.au",
            "password": "abcdEFGH123"
        });
        expect(res.status).toBe(401);
    });

    test("POST /account/login - Incorrect password", async () => {
        const res = await request(app).post("/account/login").send({
            "email": CUSTOMER_2_TEST_EMAIL,
            "password": "Incorrect Password 123"
        });
        expect(res.status).toBe(401);
    });
});

describe('Account Change Password', () => {
    test("POST /account/change-password - Happy path (as customer 1)", async () => {
        const loginRes = await request(app).post("/account/login").send({
            "email": CUSTOMER_1_TEST_EMAIL,
            "password": CUSTOMER_1_TEST_PASS_1
        });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();

        const token = loginRes.body.token;
        
        const changeRes = await request(app).post("/account/change-password")
            .set('Authorization', `Bearer ${token}`)
            .send({
                "old": CUSTOMER_1_TEST_PASS_1,
                "new": CUSTOMER_1_TEST_PASS_2
            });
        expect(changeRes.status).toBe(200);
    });

    test("POST /account/change-password - Missing/bad token", async () => {
        // No login

        const missingToken = await request(app).post("/account/change-password")
            // No Authorization
            .send({
                "old": CUSTOMER_2_TEST_PASS,
                "new": "A Very Good Password 123"
            });
        expect(missingToken.status).toBe(401);
        expect(missingToken.body).toEqual({ reason: "Missing token" });
        
        const invalidToken = await request(app).post("/account/change-password")
            .set('Authorization', 'Bearer ThisIsNotAValidJWT')
            .send({
                "old": CUSTOMER_2_TEST_PASS,
                "new": "A Very Good Password 123"
            });
        expect(invalidToken.status).toBe(401);
    });
    
    test("POST /account/change-password - Invalid new password", async () => {
        const loginRes = await request(app).post("/account/login").send({
            email: CUSTOMER_2_TEST_EMAIL,
            password: CUSTOMER_2_TEST_PASS
        });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
        
        const token = loginRes.body.token;
        const changeRes = await request(app).post("/account/change-password")
            .set('Authorization', `Bearer ${token}`)
            .send({
                "old": CUSTOMER_2_TEST_PASS,
                "new": "badpass"  // No upper case, no digits
            });
        expect(changeRes.status).toBe(400);
        expect(changeRes.body).toEqual({ reason: "Invalid change password body" });
    });

    test("POST /account/change-password - Incorrect old password", async () => {
        const loginRes = await request(app).post("/account/login").send({
            email: CUSTOMER_2_TEST_EMAIL,
            password: CUSTOMER_2_TEST_PASS
        });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
        
        const token = loginRes.body.token;
        const changeRes = await request(app).post("/account/change-password")
            .set('Authorization', `Bearer ${token}`)
            .send({
                "old": "Incorrect old password 123",
                "new": "AVeryStrongPassword123"
            });
            expect(changeRes.status).toBe(401);
    });
});

describe('Admin - GET /account/{account_id}', () => {
    test('Happy path', async () => {
        const adminJWT = await login(ADMIN_TEST_EMAIL, ADMIN_TEST_PASS);
        expect(adminJWT).not.toBeNull();

        const res = await request(app).get(`/account/${customer2Id}`)
            .set('Authorization', `Bearer ${adminJWT}`)
            .send();
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(customer2Id);
        expect(res.body.email).toBe(CUSTOMER_2_TEST_EMAIL);
    });

    test('Bad auth', async () => {
        const cust2Jwt = await login(CUSTOMER_2_TEST_EMAIL, CUSTOMER_2_TEST_PASS);
        expect(cust2Jwt).not.toBeNull();

        const missingAuth = await request(app).get(`/account/${customer1Id}`).send();
        expect(missingAuth.status).toBe(401);

        const badAuth = await request(app).get(`/account/${customer1Id}`)
            .set('Authorization', `Bearer ${cust2Jwt}`)
            .send();
        expect(badAuth.status).toBe(403);
    })
});

describe('Admin - GET /account?name&email', () => {
    var adminJWT = null;
    beforeAll(async () => {
        adminJWT = await login(ADMIN_TEST_EMAIL, ADMIN_TEST_PASS);
        if (adminJWT === null) {
            throw "Failed to login as admin"
        }
    });

    test('Happy path', async () => {
        const byEmailRes = await request(app).get(`/account?email=${CUSTOMER_1_TEST_EMAIL}`)
            .set('Authorization', `Bearer ${adminJWT}`)
            .send();
        expect(byEmailRes.status).toBe(200);
        expect(Array.isArray(byEmailRes.body)).toBe(true);
        expect(byEmailRes.body.some(acc => acc.given === CUSTOMER_1_TEST_GIVEN)).toBe(true);

        const byNameRes = await request(app).get(`/account?name=${CUSTOMER_1_TEST_GIVEN.slice(1, 7)}`)
            .set('Authorization', `Bearer ${adminJWT}`)
            .send();
        expect(byNameRes.status).toBe(200);
        expect(Array.isArray(byNameRes.body)).toBe(true);
        expect(byNameRes.body.some(acc => acc.email === CUSTOMER_1_TEST_EMAIL)).toBe(true);

    });

    test('Bad auth', async () => {
        const cust2Jwt = await login(CUSTOMER_2_TEST_EMAIL, CUSTOMER_2_TEST_PASS);
        expect(cust2Jwt).not.toBeNull();

        const missingAuth = await request(app).get(`/account?email=${CUSTOMER_1_TEST_EMAIL}`).send();
        expect(missingAuth.status).toBe(401);

        const badAuth = await request(app).get(`/account?email=${CUSTOMER_1_TEST_EMAIL}`)
            .set('Authorization', `Bearer ${cust2Jwt}`)
            .send();
        expect(badAuth.status).toBe(403);
    });
});

describe('Admin - POST /account/promote-to-admin', () => {
    var adminJWT = null;
    beforeAll(async () => {
        adminJWT = await login(ADMIN_TEST_EMAIL, ADMIN_TEST_PASS);
        if (adminJWT === null) {
            throw "Failed to login as admin"
        }
    });

    test('Happy path', async () => {
        const res = await request(app).post('/account/promote-to-admin')
            .set('Authorization', `Bearer ${adminJWT}`)
            .send({
                account_id: adminPromoteeId
            });
        expect(res.status).toBe(200);
    });

    test('Bad auth', async () => {
        const cust2Jwt = await login(CUSTOMER_2_TEST_EMAIL, CUSTOMER_2_TEST_PASS);
        expect(cust2Jwt).not.toBeNull();

        const missingAuth = await request(app).post('/account/promote-to-admin')
            .send({
                account_id: 0
            });
        expect(missingAuth.status).toBe(401);

        const badAuth = await request(app).post('/account/promote-to-admin')
            .set('Authorization', `Bearer ${cust2Jwt}`)
            .send({
                account_id: 0
            });
        expect(badAuth.status).toBe(403);
    });
});
