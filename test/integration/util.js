import request from 'supertest';
import { app } from "../../src/app.js";

export async function login(email, password) {
    const res = await request(app).post('/account/login').send({
        email: email,
        password: password
    });
    return res.status === 200 ? res.body.token : null;
}