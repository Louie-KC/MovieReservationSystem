import mysql from 'mysql2/promise';

export let dbConnPool = null;

export const dbInit = () => {
    dbConnPool = mysql.createPool({
        host: process.env.MYSQL_DB_ADDR,
        database: process.env.MYSQL_DB_NAME,
        user: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
    })
    console.log("dbInit complete");
}
