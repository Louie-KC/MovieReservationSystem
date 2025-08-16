import mysql from 'mysql2/promise';

export let dbConnPool = null;

export const dbInit = () => {
    dbConnPool = mysql.createPool({
        host: process.env.MYSQL_DB_ADDR,
        database: process.env.MYSQL_DB_NAME,
        user: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        timezone: 'Z' // Avoid converting from UTC to local time w/ SELECT queries
    })
    console.log("dbInit complete");
}
