import express from 'express';
import { createOrder, verifyPayment, getTransactions } from '../controllers/paymentController.js';
import authUser from '../middlewares/auth.js';

const paymentRouter = express.Router();

// Create Razorpay order
paymentRouter.post('/create-order', authUser, createOrder);

// Verify payment and add credits
paymentRouter.post('/verify', authUser, verifyPayment);

// Get transaction history
paymentRouter.get('/transactions', authUser, getTransactions);

export default paymentRouter;