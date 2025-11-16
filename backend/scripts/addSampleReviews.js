const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Sample review comments
const positiveComments = [
    "Excellent laptop! Perfect for my work needs. Fast delivery and great customer service.",
    "Amazing performance and build quality. Highly recommend this laptop!",
    "Great value for money. The screen is stunning and battery life is impressive.",
    "Perfect for gaming and daily use. Love the design and functionality.",
    "Outstanding laptop! Exceeded my expectations in every way.",
    "Fantastic purchase! The laptop is fast, reliable, and looks premium.",
    "Best laptop I've ever owned. Great for productivity and entertainment.",
    "Superb quality and performance. Worth every penny!",
    "Love this laptop! The display is gorgeous and it's very portable.",
    "Excellent choice! Fast shipping and the laptop works perfectly."
];

const mixedComments = [
    "Good laptop overall, but battery life could be better. Still satisfied with the purchase.",
    "Decent performance for the price. Some minor issues but nothing major.",
    "Solid laptop with good specs. Could use some improvements in build quality.",
    "Average experience. Works well for basic tasks but not for heavy gaming.",
    "Not bad, but expected more from this price range. Still usable.",
    "Okay laptop. Does the job but has some heating issues during extended use.",
    "Fair performance. Good for office work but not ideal for creative tasks.",
    "Mediocre build quality but functional. Gets the work done.",
    "Acceptable laptop. Could be better but serves my basic needs.",
    "Below average experience. Works but has some software issues."
];

const negativeComments = [
    "Disappointed with this purchase. Laptop overheats frequently and performance is poor.",
    "Not worth the money. Multiple issues with display and keyboard.",
    "Terrible experience. Laptop crashed multiple times in the first week.",
    "Poor build quality and customer support. Regret buying this.",
    "Worst laptop I've owned. Constant freezing and slow performance.",
    "Very dissatisfied. Battery drains quickly and ports are limited.",
    "Avoid this laptop. Major issues with the operating system and drivers.",
    "Complete waste of money. Doesn't meet any of the advertised specifications.",
    "Horrible purchase. Laptop arrived damaged and support was unhelpful.",
    "Extremely disappointed. Would not recommend to anyone."
];

const getRandomComment = (rating) => {
    if (rating >= 4) {
        return positiveComments[Math.floor(Math.random() * positiveComments.length)];
    } else if (rating >= 2.5) {
        return mixedComments[Math.floor(Math.random() * mixedComments.length)];
    } else {
        return negativeComments[Math.floor(Math.random() * negativeComments.length)];
    }
};

const addSampleReviews = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected\n');

        // Get all delivered orders
        const deliveredOrders = await Order.find({ orderStatus: 'Delivered' }).populate('user').populate('orderItems.product');

        if (deliveredOrders.length === 0) {
            console.log('❌ No delivered orders found. Please run addSampleOrders.js first.');
            process.exit(1);
        }

        console.log(`Found ${deliveredOrders.length} delivered orders\n`);

        // Clear existing reviews from all products
        console.log('🔍 Clearing existing reviews...');
        await Product.updateMany({}, { $set: { reviews: [], numOfReviews: 0, ratings: 0 } });
        console.log('✅ Existing reviews cleared\n');

        // Create reviews for delivered orders
        console.log('🔄 Creating reviews for delivered orders...\n');
        let reviewCount = 0;
        const processedProducts = new Set(); // Track products that have been reviewed

        for (const order of deliveredOrders) {
            for (const orderItem of order.orderItems) {
                try {
                    const product = orderItem.product;
                    const user = order.user;

                    // Skip if this product has already been reviewed by this user
                    const existingReview = product.reviews.find(review =>
                        review.user.toString() === user._id.toString()
                    );

                    if (existingReview) {
                        continue; // Skip duplicate reviews
                    }

                    // Generate random rating (weighted towards positive)
                    const random = Math.random();
                    let rating;
                    if (random < 0.6) rating = 5; // 60% 5-star
                    else if (random < 0.8) rating = 4; // 20% 4-star
                    else if (random < 0.9) rating = 3; // 10% 3-star
                    else if (random < 0.95) rating = 2; // 5% 2-star
                    else rating = 1; // 5% 1-star

                    // Create review
                    const review = {
                        user: user._id,
                        username: user.username,
                        rating: rating,
                        comment: Math.random() < 0.3 ? '' : getRandomComment(rating), // 30% chance of no comment
                        isAnonymous: Math.random() < 0.1, // 10% anonymous
                        createdAt: new Date(order.deliveredAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) // Within 30 days after delivery
                    };

                    // Add review to product
                    product.reviews.push(review);
                    product.numOfReviews = product.reviews.length;

                    // Calculate new average rating
                    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
                    product.ratings = Number((totalRating / product.reviews.length).toFixed(1));

                    // Save product
                    await product.save();

                    reviewCount++;
                    processedProducts.add(product._id.toString());

                    if (reviewCount % 50 === 0) {
                        console.log(`   Created ${reviewCount} reviews...`);
                    }

                } catch (error) {
                    console.error(`❌ Error creating review for order ${order._id}:`, error.message);
                }
            }
        }

        console.log('\n==========================================');
        console.log('Sample Reviews Summary:');
        console.log(`✅ Successfully created: ${reviewCount} reviews`);
        console.log(`📦 Products with reviews: ${processedProducts.size}`);
        console.log('==========================================\n');

        // Calculate rating distribution
        const products = await Product.find({ numOfReviews: { $gt: 0 } });
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        products.forEach(product => {
            product.reviews.forEach(review => {
                ratingDistribution[review.rating]++;
            });
        });

        console.log('📊 Rating Distribution:');
        Object.entries(ratingDistribution).forEach(([rating, count]) => {
            if (count > 0) {
                const percentage = ((count / reviewCount) * 100).toFixed(1);
                console.log(`   ${rating} star: ${count} reviews (${percentage}%)`);
            }
        });

        // Show some statistics
        const avgReviewsPerProduct = (reviewCount / processedProducts.size).toFixed(1);
        const avgRating = products.reduce((sum, product) => sum + product.ratings, 0) / products.length;

        console.log('\n📈 Statistics:');
        console.log(`   Average reviews per product: ${avgReviewsPerProduct}`);
        console.log(`   Average product rating: ${avgRating.toFixed(1)}/5`);
        console.log(`   Products without reviews: ${products.length - processedProducts.size}`);

        console.log('\n🎉 Sample reviews have been created!');
        console.log('\n📝 Review Details:');
        console.log('- Reviews only for delivered orders');
        console.log('- Weighted towards positive ratings (60% 5-star)');
        console.log('- Realistic comments based on ratings');
        console.log('- 30% of reviews have no comments');
        console.log('- 10% of reviews are anonymous');
        console.log('- Review dates are after delivery dates');

        process.exit(0);
    } catch (error) {
        console.error('Error adding sample reviews:', error);
        process.exit(1);
    }
};

addSampleReviews();