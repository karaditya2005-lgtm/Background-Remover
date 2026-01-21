// models/imageModel.js
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        index: true
    },
    originalImageUrl: {
        type: String,
        required: true
    },
    processedImageUrl: {
        type: String,
        required: true
    },
    originalPublicId: {
        type: String,
        required: true
    },
    processedPublicId: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        default: 'Untitled'
    },
    fileSize: {
        type: Number // in bytes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
imageSchema.index({ clerkId: 1, createdAt: -1 });

export default mongoose.model('Image', imageSchema);