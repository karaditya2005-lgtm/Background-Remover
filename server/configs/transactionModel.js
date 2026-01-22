// models/transactionModel.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    packageType: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Transaction', transactionSchema);