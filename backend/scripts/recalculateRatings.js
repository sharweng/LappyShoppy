const mongoose = require('mongoose');
const Product = require('../models/product');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    recalculateAllRatings();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function recalculateAllRatings() {
    try {
        console.log('Recalculating ratings for all products...');
        
        // Get all products
        const products = await Product.find();
        
        let updatedCount = 0;
        
        for (const product of products) {
            // Calculate ratings from reviews
            const numOfReviews = product.reviews.length;
            const ratings = numOfReviews > 0 
                ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews 
                : 0;
            
            // Update product
            product.ratings = ratings;
            product.numOfReviews = numOfReviews;
            await product.save({ validateBeforeSave: false });
            
            updatedCount++;
            console.log(`✓ Updated ${product.name}: ${numOfReviews} reviews, ${ratings.toFixed(1)} rating`);
        }
        
        console.log(`\n✓ Successfully recalculated ratings for ${updatedCount} products`);
        process.exit(0);
    } catch (error) {
        console.error('Error recalculating ratings:', error);
        process.exit(1);
    }
}
