import Razorpay from 'razorpay';
import crypto from 'crypto';
import userModel from '../models/userModel.js';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Package pricing - matching your plansData
const packages = {
    basic: { 
        credits: 10, 
        amount: 9900, // ₹99 in paise (99 * 100)
        name: 'Basic Plan'
    },
    standard: { 
        credits: 50, 
        amount: 39900, // ₹399 in paise (399 * 100)
        name: 'Standard Plan'
    },
    premium: { 
        credits: 100, 
        amount: 69900, // ₹699 in paise (699 * 100)
        name: 'Premium Plan'
    }
};

const createOrder = async (req, res) => {
    try {
        const { packageType, clerkId } = req.body; // ⭐ Get clerkId from req.body (set by auth middleware)

        console.log('Create order request:', { packageType, clerkId });

        if (!clerkId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        const packageData = packages[packageType];
        if (!packageData) {
            return res.json({ success: false, message: 'Invalid package selected' });
        }

        // Create Razorpay order
        // Receipt must be max 40 chars - use short unique ID
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const userHash = clerkId.slice(-8); // Last 8 chars of clerkId
        const receipt = `rcpt_${userHash}_${timestamp}`; // Format: rcpt_XXXXXXXX_XXXXXXXX (max 27 chars)
        
        const options = {
            amount: packageData.amount,
            currency: 'INR',
            receipt: receipt,
            notes: {
                packageType,
                credits: packageData.credits,
                clerkId
            }
        };

        const order = await razorpay.orders.create(options);

        console.log('✅ Razorpay order created:', order.id);

        res.json({
            success: true,
            order: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID
            },
            package: {
                credits: packageData.credits,
                type: packageType,
                name: packageData.name
            }
        });

    } catch (error) {
        console.error('❌ Create order error:', error);
        res.json({ 
            success: false, 
            message: error.message || 'Failed to create order'
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            packageType,
            clerkId // ⭐ Get clerkId from req.body (set by auth middleware)
        } = req.body;

        console.log('Verify payment request:', { 
            razorpay_order_id, 
            razorpay_payment_id, 
            packageType, 
            clerkId 
        });

        if (!clerkId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        // Verify Razorpay signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            console.error('❌ Payment signature verification failed');
            return res.json({ 
                success: false, 
                message: 'Payment verification failed. Invalid signature.' 
            });
        }

        // Get package data
        const packageData = packages[packageType];
        if (!packageData) {
            return res.json({ success: false, message: 'Invalid package type' });
        }

        // Add credits to user account
        const updatedUser = await userModel.findOneAndUpdate(
            { clerkId },
            { $inc: { creditBalance: packageData.credits } },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        console.log('✅ Credits added successfully:', {
            clerkId,
            creditsAdded: packageData.credits,
            newBalance: updatedUser.creditBalance
        });

        res.json({
            success: true,
            message: `${packageData.credits} credits added successfully!`,
            creditBalance: updatedUser.creditBalance
        });

    } catch (error) {
        console.error('❌ Verify payment error:', error);
        res.json({ 
            success: false, 
            message: error.message || 'Payment verification failed'
        });
    }
};

// Transaction history (optional feature)
const getTransactions = async (req, res) => {
    try {
        const { clerkId } = req.body; // ⭐ Get clerkId from req.body

        if (!clerkId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        // You can implement transaction history here
        // For now, returning empty array
        res.json({
            success: true,
            transactions: []
        });

    } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.json({ 
            success: false, 
            message: error.message || 'Failed to fetch transactions'
        });
    }
};

export { createOrder, verifyPayment, getTransactions };