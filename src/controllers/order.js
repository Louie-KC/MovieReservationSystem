import asyncHandler from 'express-async-handler';
import * as Auth from '../services/auth.js';
import { logger } from '../utils/logger.js';
import { Schedule } from '../models/schedule.js';
import { Order } from '../models/order.js';

// GET /order/history
export const getOrderHistory = asyncHandler(async (req, res, next) => {
    // Authorisation
    const tokenCheck = await Auth.extractVerifyJWT(req, false);
    if (tokenCheck.failHttpCode !== null) {
        return res.status(tokenCheck.failHttpCode).send();
    }

    // Get order/reservation history
    const history = await Order.findHistoryByUserId(tokenCheck.userId);
    if (history === null) {
        return res.status(500).send();
    } else {
        return res.status(200).json(history);
    }
});

// POST /order/reserve
export const postOrderReserve = asyncHandler(async (req, res, next) => {
    // Authorisation
    const tokenCheck = await Auth.extractVerifyJWT(req, false);
    if (tokenCheck.failHttpCode !== null) {
        return res.status(tokenCheck.failHttpCode).send();
    }
    if (!req.body || !Order.validateFieldsReserve(req.body)) {
        return res.status(400).json({ reason: "Invalid reserve body" });
    }

    // Ensure all seats are valid
    const seats = await Schedule.findSeatingAvailabilityById(req.body.schedule);
    const availableSet = new Set(seats.filter(seat => seat.available).map(seat => seat.seat));
    
    // Ensure all requested seats are available
    if (!req.body.seats.every(seat => availableSet.has(seat))) {
        return res.status(400).json({ reason: "Cannot reserve already reserved seats" });
    }
    
    // Make reservation
    const result = await Order.reserve(tokenCheck.userId, req.body);
    if (result.reservationId !== null && result.err === null) {
        return res.status(200).json({ reservation_id: result.reservationId });
    } else {
        if (result.err === "Seat already reserved") {
            return res.status(400).json({ reason: "Cannot reserve already reserved seats" });
        } else {
            return res.status(500).send();
        }
    }
});

// POST /order/confirm
export const postOrderConfirm = asyncHandler(async (req, res, next) => {
    // Authorisation
    const tokenCheck = await Auth.extractVerifyJWT(req, false);
    if (tokenCheck.failHttpCode !== null) {
        return res.status(tokenCheck.failHttpCode).send();
    }
    if (!req.body || !Order.validateFieldsConfirmCancel(req.body)) {
        return res.status(400).json({ reason: "Invalid request body" });
    }

    // Confirm
    const result = await Order.confirmRevervation(tokenCheck.userId, req.body);
    if (result.err !== null) {
        const errMsg = result.err.message;
        // Check for pre-update Reservation trigger message
        if (errMsg.startsWith("Scheduled time") && errMsg.endsWith(" is in the past")) {
            return res.status(400).json({ reason: "Reservation is in the past" });
        } else {
            return res.status(500).send();
        }
    }
    if (!result.success) {
        return res.status(400).send();
    } else {
        return res.status(200).send();
    }
});

// POST /order/cancel
export const postOrderCancel = asyncHandler(async (req, res, next) => {
    // Authorisation
    const tokenCheck = await Auth.extractVerifyJWT(req, false);
    if (tokenCheck.failHttpCode !== null) {
        return res.status(tokenCheck.failHttpCode).send();
    }

    if (!req.body || !Order.validateFieldsConfirmCancel(req.body)) {
        return res.status(400).json({ reason: "Invalid request body" });
    }

    // Cancel
    const result = await Order.cancelRevervation(tokenCheck.userId, req.body);
    if (result.err !== null) {
        const errMsg = result.err.message;
        // Check for pre-update Reservation trigger message
        if (errMsg.startsWith("Scheduled time") && errMsg.endsWith(" is in the past")) {
            return res.status(400).json({ reason: "Reservation is in the past" });
        } else {
            return res.status(500).send();
        }
    }
    if (!result.success) {
        return res.status(400).send();
    } else {
        return res.status(200).send();
    }
});
