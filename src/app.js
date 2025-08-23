import express from 'express';
import { accountRouter } from './routes/account.js';
import { locationRouter } from './routes/location.js';
import { movieRouter } from './routes/movie.js';
import { orderRouter } from './routes/order.js';
import { scheduleRouter } from './routes/schedule.js';
import { dbInit } from './services/database.js';
import { checkerInitValid } from './utils/checker.js';
import { setDateExtensions } from './utils/dateExtension.js';
import { logger, requestLogger } from './utils/logger.js';

// Ensure all env variables are set
const expectedVarNames = ["SERVER_PORT", "LOG_LEVEL", "MYSQL_DB_ADDR",
    "MYSQL_DB_NAME", "MYSQL_DB_PORT", "MYSQL_DB_USER", "MYSQL_DB_PASS",
    "JWT_SECRET", "JWT_EXPIRE_TIME", "PASSWORD_SALT_ROUNDS"];
const missingVars = expectedVarNames.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    logger.fatal(`Missing environment variables ${JSON.stringify(missingVars)}`);
    process.exit(1);
}

// Set up Express server
export const app = express();
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_, res) => {
    res.send();
})

app.use('/account', accountRouter);
app.use('/location', locationRouter);
app.use('/movie', movieRouter);
app.use('/order', orderRouter);
app.use('/schedule', scheduleRouter);

// Initialise services & utils
if (!checkerInitValid()) {
    process.exit(1);
}
setDateExtensions();

await dbInit();

// Start
const SERVER_PORT = process.env.SERVER_PORT;
export const server = app.listen(SERVER_PORT, () => {
    logger.info(`Movie Reservation Service listening to port ${SERVER_PORT}`);
})
