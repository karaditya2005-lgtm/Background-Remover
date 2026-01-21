// routes/imageRoutes.js
import express from 'express';
import { removeBgImage, getImageHistory, deleteImage } from '../controllers/imageController.js';
import authUser from '../middlewares/auth.js';
import multer from 'multer';

const imageRouter = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit (increased from 10MB)
    },
    fileFilter: (req, file, cb) => {
        // Optional: Add file type validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'));
        }
    }
});

// Custom error handler for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.json({ 
                success: false, 
                message: 'File is too large. Maximum size allowed is 50MB. Please compress your image and try again.' 
            });
        }
        return res.json({ 
            success: false, 
            message: `Upload error: ${err.message}` 
        });
    } else if (err) {
        return res.json({ 
            success: false, 
            message: err.message 
        });
    }
    next();
};

// Remove background (with file upload)
imageRouter.post('/remove-bg', 
    upload.single('image'),
    handleMulterError,
    authUser,
    removeBgImage
);

// Get user's image history
imageRouter.get('/history', authUser, getImageHistory);

// Delete image from history
imageRouter.delete('/history/:imageId', authUser, deleteImage);

export default imageRouter;