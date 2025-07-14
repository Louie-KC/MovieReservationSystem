import express from 'express';
import { accountRouter } from './routes/account.js';
import { locationRouter } from './routes/location.js';
import { movieRouter } from './routes/movie.js';
import { orderRouter } from './routes/order.js';
import { scheduleRouter } from './routes/schedule.js';
import { dbInit } from './services/database.js';
import { checkerInitValid } from './utils/checker.js';

const PORT = 8080

const app = express();
app.use(express.json());

app.get("/health", (_, res) => {
    res.send();
})

app.use('/account', accountRouter);
app.use('/location', locationRouter);
app.use('/movie', movieRouter);
app.use('/order', orderRouter);
app.use('/schedule', scheduleRouter);

if (!checkerInitValid()) {
    process.exit(1);
}

await dbInit();

app.listen(PORT, () => {
    console.log(`Movie Reservation Service listening to port ${PORT}`)    
})
