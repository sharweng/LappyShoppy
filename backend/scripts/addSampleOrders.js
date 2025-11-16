const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Sample data generators
const cities = ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Cebu City', 'Davao City', 'Baguio', 'Iloilo City', 'Zamboanga City'];
const countries = ['Philippines'];
const streets = ['Rizal Avenue', 'Ayala Avenue', 'EDSA', 'Taft Avenue', 'Gil Puyat Avenue', ' BGC', 'Bonifacio Global City', 'Ortigas Center'];

const generateRandomAddress = () => {
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${number} ${street}`;
};

const generateRandomPhone = () => {
    const prefix = ['0917', '0918', '0927', '0939', '0949', '0956', '0966', '0977', '0998', '0999'];
    const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix[Math.floor(Math.random() * prefix.length)]}${number}`;
};

const generateRandomPostalCode = () => {
    return Math.floor(Math.random() * 9000 + 1000).toString();
};

const orderStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

const getRandomDate = (startDate, endDate) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
};

const addSampleOrders = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected\n');

        // Get all products and users
        const products = await Product.find({});
        const users = await User.find({ role: { $ne: 'admin' } }); // Exclude admin users

        if (products.length === 0) {
            console.log('❌ No products found. Please run addSampleProducts.js first.');
            process.exit(1);
        }

        if (users.length === 0) {
            console.log('❌ No users found. Please run addSampleUsers.js first.');
            process.exit(1);
        }

        console.log(`Found ${products.length} products and ${users.length} users\n`);

        // Clear existing orders and reviews
        console.log('🔍 Checking for existing orders and reviews...');
        const existingOrders = await Order.find({});
        const productsWithReviews = await Product.find({ 'reviews.0': { $exists: true } });
        
        if (existingOrders.length > 0) {
            await Order.deleteMany({});
            console.log(`✅ Cleared ${existingOrders.length} existing orders`);
        }
        
        if (productsWithReviews.length > 0) {
            await Product.updateMany({}, { $set: { reviews: [], numOfReviews: 0, ratings: 0 } });
            console.log(`✅ Cleared reviews from ${productsWithReviews.length} products`);
        }
        
        if (existingOrders.length > 0 || productsWithReviews.length > 0) {
            console.log('✅ Database cleared\n');
        } else {
            console.log('✅ No existing orders or reviews found\n');
        }

        // Ensure all products have at least one delivered order
        console.log('🔄 Creating guaranteed delivered orders for all products...\n');
        const deliveredOrders = [];

        for (const product of products) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
            const orderDate = getRandomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()); // Last year to now

            const orderData = {
                shippingInfo: {
                    address: generateRandomAddress(),
                    city: cities[Math.floor(Math.random() * cities.length)],
                    phoneNo: generateRandomPhone(),
                    postalCode: generateRandomPostalCode(),
                    country: 'Philippines'
                },
                user: randomUser._id,
                orderItems: [{
                    name: product.name,
                    quantity: quantity,
                    image: product.images[0]?.url || '',
                    price: product.price,
                    product: product._id
                }],
                paymentInfo: {
                    id: `COD`,
                    status: 'Paid' // Always Paid for guaranteed delivered orders
                },
                paidAt: new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Payment within a week
                itemsPrice: product.price * quantity,
                taxPrice: Math.round(product.price * quantity * 0.12), // 12% tax
                shippingPrice: 150, // Fixed shipping
                totalPrice: product.price * quantity + Math.round(product.price * quantity * 0.12) + 150,
                orderStatus: 'Delivered',
                deliveredAt: new Date(orderDate.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000), // Delivery 7-21 days later
                createdAt: orderDate
            };

            const order = await Order.create(orderData);
            deliveredOrders.push(order);
            console.log(`✅ Guaranteed delivered order: ${product.name} for ${randomUser.name}`);
        }

        // Create additional random orders (80% delivered, 20% other statuses)
        console.log('\n🔄 Creating additional random orders...\n');
        const totalAdditionalOrders = Math.max(200, products.length * 3); // At least 200 orders or 3x products
        let successCount = deliveredOrders.length;

        for (let i = 0; i < totalAdditionalOrders; i++) {
            try {
                // Random product and user
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                const randomUser = users[Math.floor(Math.random() * users.length)];

                // Random quantity (1-5)
                const quantity = Math.floor(Math.random() * 5) + 1;

                // Random order date (last year to now)
                const orderDate = getRandomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date());

                // Determine status (80% delivered, 20% other)
                const statusRandom = Math.random();
                let orderStatus, deliveredAt, cancelledAt;

                if (statusRandom < 0.8) {
                    orderStatus = 'Delivered';
                    deliveredAt = new Date(orderDate.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000);
                } else {
                    // Random other status
                    const otherStatuses = ['Processing', 'Shipped', 'Cancelled'];
                    orderStatus = otherStatuses[Math.floor(Math.random() * otherStatuses.length)];
                    if (orderStatus === 'Cancelled') {
                        cancelledAt = new Date(orderDate.getTime() + (1 + Math.random() * 7) * 24 * 60 * 60 * 1000);
                    }
                }

                const orderData = {
                    shippingInfo: {
                        address: generateRandomAddress(),
                        city: cities[Math.floor(Math.random() * cities.length)],
                        phoneNo: generateRandomPhone(),
                        postalCode: generateRandomPostalCode(),
                        country: 'Philippines'
                    },
                    user: randomUser._id,
                    orderItems: [{
                        name: randomProduct.name,
                        quantity: quantity,
                        image: randomProduct.images[0]?.url || '',
                        price: randomProduct.price,
                        product: randomProduct._id
                    }],
                    paymentInfo: {
                        id: `COD`,
                        status: orderStatus === 'Delivered' ? 'Paid' : 
                               orderStatus === 'Cancelled' ? 'Failed' : 'Processing'
                    },
                    paidAt: orderStatus !== 'Cancelled' ? new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
                    itemsPrice: randomProduct.price * quantity,
                    taxPrice: Math.round(randomProduct.price * quantity * 0.12),
                    shippingPrice: 150,
                    totalPrice: randomProduct.price * quantity + Math.round(randomProduct.price * quantity * 0.12) + 150,
                    orderStatus: orderStatus,
                    deliveredAt: deliveredAt,
                    cancelledAt: cancelledAt,
                    createdAt: orderDate
                };

                await Order.create(orderData);
                successCount++;

                if (i % 50 === 0) {
                    console.log(`   Created ${i + 1}/${totalAdditionalOrders} additional orders...`);
                }

            } catch (error) {
                console.error(`❌ Error creating order ${i + 1}:`, error.message);
            }
        }

        console.log('\n==========================================');
        console.log('Sample Orders Summary:');
        console.log(`✅ Successfully created: ${successCount} orders`);
        console.log(`📦 Guaranteed delivered orders: ${deliveredOrders.length} (one per product)`);
        console.log(`🎲 Additional random orders: ${totalAdditionalOrders}`);
        console.log('==========================================\n');

        // Calculate status distribution
        const allOrders = await Order.find({});
        const statusCounts = {};
        allOrders.forEach(order => {
            statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
        });

        console.log('📊 Order Status Distribution:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            const percentage = ((count / allOrders.length) * 100).toFixed(1);
            console.log(`   ${status}: ${count} orders (${percentage}%)`);
        });

        console.log('\n🎉 Sample orders have been created!');
        console.log('\n📝 Order Details:');
        console.log('- All products have at least 1 delivered order');
        console.log('- Orders date back to last year');
        console.log('- ~80% delivered, ~20% other statuses');
        console.log('- Payment method: COD (Cash on Delivery)');
        console.log('- Payment status: Paid (Delivered), Failed (Cancelled), Processing (Others)');
        console.log('- Random quantities, shipping info, and dates');
        console.log('\n💡 You can now run addSampleReviews.js to add reviews for delivered orders');

        process.exit(0);
    } catch (error) {
        console.error('Error adding sample orders:', error);
        process.exit(1);
    }
};

addSampleOrders();