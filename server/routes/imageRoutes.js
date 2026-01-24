// routes/imageRoutes.js
import express from 'express';
import { removeBgImage, getImageHistory, deleteImage, getImageCount, generateAIBackground } from '../controllers/imageController.js';
import authUser from '../middlewares/auth.js';
import multer from 'multer';

const imageRouter = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit to handle base64 overhead
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
            // Get the file size if available
            const fileSize = req.file?.size || req.headers['content-length'];
            const fileSizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : 'unknown';
            
            return res.json({ 
                success: false, 
                message: `File is too large (${fileSizeMB}MB). Maximum size allowed is 100MB. Please compress your image and try again.` 
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

// ⭐ CORRECTED: authUser BEFORE upload - this is critical!
imageRouter.post('/remove-bg', 
    authUser,              // 1. Authenticate first and set req.userId
    upload.single('image'), // 2. Then process file upload
    handleMulterError,     // 3. Handle any upload errors
    removeBgImage          // 4. Finally run controller
);

// ⭐ CORRECTED: authUser BEFORE upload
imageRouter.post('/generate-bg', 
    authUser,              // 1. Authenticate first and set req.userId
    upload.single('image'), // 2. Then process file upload
    handleMulterError,     // 3. Handle any upload errors
    generateAIBackground   // 4. Finally run controller
);

// Get user's image history
imageRouter.get('/history', authUser, getImageHistory);

// Delete image from history
imageRouter.delete('/history/:imageId', authUser, deleteImage);

// Get image count (public route, no auth needed)
imageRouter.get('/count', getImageCount);

export default imageRouter;