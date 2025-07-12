import express from 'express';
import { account_router } from './routes/account.js';
import { location_router } from './routes/location.js';
import { movie_router } from './routes/movie.js';
import { order_router } from './routes/order.js';
import { schedule_router } from './routes/schedule.js';

const app = express();
app.use(express.json());

const port = 8080

app.get("/health", (_, res) => {
    res.send();
})

app.use('/account', account_router);
app.use('/location', location_router);
app.use('/movie', movie_router);
app.use('/order', order_router);
app.use('/schedule', schedule_router);

app.listen(port, () => {
    console.log(`Movie Reservation Service listening to port ${port}`)    
})