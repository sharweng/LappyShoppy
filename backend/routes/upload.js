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

        const result = await cloudinary.v2.uploader.upload(req.body.image, {
            folder: 'lappyshoppy/avatars',
            width: 150,
            crop: "scale",
            transformation: [
                { width: 150, height: 150, crop: "fill", gravity: "face" }
            ]
        });

        return res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error uploading image',
            error: error.message 
        });
    }
});

module.exports = router;
