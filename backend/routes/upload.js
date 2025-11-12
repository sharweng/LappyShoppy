const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');

// Public endpoint for avatar uploads (no authentication required)
router.post('/avatar', async (req, res) => {
    try {
        if (!req.body.image) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image provided' 
            });
        }

        // Set timeout for Cloudinary upload (30 seconds)
        const uploadPromise = cloudinary.v2.uploader.upload(req.body.image, {
            folder: 'lappyshoppy/avatars',
            width: 150,
            crop: "scale",
            transformation: [
                { width: 150, height: 150, crop: "fill", gravity: "face" }
            ],
            timeout: 60000 // 60 seconds timeout
        });

        // Add a timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout - please check your internet connection')), 60000);
        });

        const result = await Promise.race([uploadPromise, timeoutPromise]);

        return res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Handle specific timeout errors
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
            return res.status(408).json({ 
                success: false, 
                message: 'Upload timeout. Please check your internet connection and try again.',
                error: 'TIMEOUT'
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: 'Error uploading image. Please try again.',
            error: error.message || 'Unknown error'
        });
    }
});

module.exports = router;
