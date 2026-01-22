// controllers/imageController.js
import axios from 'axios';
import userModel from '../models/userModel.js';
import imageModel from '../models/imageModel.js';
import FormData from 'form-data';
import { uploadToCloudinary } from '../configs/cloudinary.js';

const removeBgImage = async (req, res) => {
    try {
        console.log('🔥 Remove BG endpoint hit!');
        console.log('📦 Content-Length header:', req.headers['content-length']);
        console.log('📁 File info:', req.file ? {
            originalname: req.file.originalname,
            size: req.file.size,
            sizeInMB: (req.file.size / (1024 * 1024)).toFixed(2) + 'MB',
            mimetype: req.file.mimetype
        } : 'NO FILE RECEIVED');
        
        const { clerkId } = req.body;
        console.log('📌 ClerkId from req.body:', clerkId);

        if (!clerkId) {
            return res.json({ success: false, message: 'Authentication failed. ClerkId not found.' });
        }

        // Get user data
        const user = await userModel.findOne({ clerkId });
        console.log('👤 User found:', user ? `${user.firstName} ${user.lastName}` : 'NOT FOUND');

        if (!user) {
            return res.json({ 
                success: false, 
                message: 'User not found. Please sign up again or contact support.' 
            });
        }

        console.log('💰 User credits:', user.creditBalance);

        if (user.creditBalance < 1) {
            return res.json({ success: false, message: 'Insufficient credits. Please purchase more.' });
        }

        if (!req.file) {
            return res.json({ success: false, message: 'No image file provided' });
        }

        console.log('📸 Image received:', req.file.originalname, `(${(req.file.size / 1024).toFixed(2)} KB)`);

        // Upload original image to Cloudinary
        console.log('☁️ Uploading original image to Cloudinary...');
        const originalUpload = await uploadToCloudinary(req.file.buffer, 'bg-remover/original');
        console.log('✅ Original uploaded:', originalUpload.secure_url);

        // Create form data for ClipDrop API
        const formData = new FormData();
        formData.append('image_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        console.log('🚀 Calling ClipDrop API...');

        // Call ClipDrop API
        const response = await axios.post(
            'https://clipdrop-api.co/remove-background/v1',
            formData,
            {
                headers: {
                    'x-api-key': process.env.CLIPDROP_API_KEY,
                    ...formData.getHeaders()
                },
                responseType: 'arraybuffer'
            }
        );

        console.log('✅ ClipDrop API success!');

        // Upload processed image to Cloudinary
        console.log('☁️ Uploading processed image to Cloudinary...');
        const processedUpload = await uploadToCloudinary(
            Buffer.from(response.data), 
            'bg-remover/processed'
        );
        console.log('✅ Processed uploaded:', processedUpload.secure_url);

        // Save image history to database
        const imageRecord = await imageModel.create({
            clerkId,
            originalImageUrl: originalUpload.secure_url,
            processedImageUrl: processedUpload.secure_url,
            originalPublicId: originalUpload.public_id,
            processedPublicId: processedUpload.public_id,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });

        console.log('💾 Image history saved:', imageRecord._id);

        // Deduct 1 credit from user
        console.log('💳 Deducting 1 credit...');
        await userModel.findOneAndUpdate(
            { clerkId },
            { $inc: { creditBalance: -1 } }
        );

        console.log('✅ Credit deducted successfully');
        console.log('🎉 Background removal complete!');

        res.json({
            success: true,
            message: 'Background removed successfully',
            data: {
                originalImageUrl: originalUpload.secure_url,
                processedImageUrl: processedUpload.secure_url,
                imageId: imageRecord._id
            },
            creditBalance: user.creditBalance - 1
        });

    } catch (error) {
        console.error('❌ Remove BG Error:', error.message);
        console.error('Error details:', error.response?.data || error);
        
        res.json({ 
            success: false, 
            message: error.response?.data?.error || error.message || 'Failed to remove background'
        });
    }
};

// Get user's image history
const getImageHistory = async (req, res) => {
    try {
        const { clerkId } = req.body;

        if (!clerkId) {
            return res.json({ success: false, message: 'Authentication required' });
        }

        const images = await imageModel
            .find({ clerkId })
            .sort({ createdAt: -1 }) // Latest first
            .limit(50); // Limit to 50 images

        res.json({
            success: true,
            images
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete image from history
const deleteImage = async (req, res) => {
    try {
        const { clerkId } = req.body;
        const { imageId } = req.params;

        if (!clerkId) {
            return res.json({ success: false, message: 'Authentication required' });
        }

        // Find image and verify ownership
        const image = await imageModel.findOne({ _id: imageId, clerkId });

        if (!image) {
            return res.json({ success: false, message: 'Image not found' });
        }

        // Delete from Cloudinary
        const { deleteFromCloudinary } = await import('../configs/cloudinary.js');
        await deleteFromCloudinary(image.originalPublicId);
        await deleteFromCloudinary(image.processedPublicId);

        // Delete from database
        await imageModel.findByIdAndDelete(imageId);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Delete image error:', error);
        res.json({ success: false, message: error.message });
    }
};
const getImageCount = async (req, res) => {
    try {
        const totalImages = await imageModel.countDocuments();
        
        res.json({
            success: true,
            count: totalImages
        });
    } catch (error) {
        console.error('Get image count error:', error);
        res.json({ success: false, message: error.message });
    }
};

export { removeBgImage, getImageHistory, deleteImage, getImageCount };