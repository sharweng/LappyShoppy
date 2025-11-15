const mongoose = require('mongoose');
const Product = require('../models/product');
const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Product images directory
const IMAGES_DIR = path.join(__dirname, 'product-images');

// Sample laptop products with image filenames
const sampleProducts = [
    {
        name: 'Dell XPS 15 9520',
        price: 102594.00,
        description: 'Powerful laptop with stunning 15.6-inch OLED display, perfect for creators and professionals. Features the latest Intel processor and dedicated NVIDIA graphics.',
        brand: 'Dell',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3050',
        operatingSystem: 'Windows 11 Pro',
        category: 'Business Laptop',
        seller: 'Dell Official Store',
        stock: 25,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: []
    },
    {
        name: 'MacBook Pro 14 M3',
        price: 134946.00,
        description: 'Apple MacBook Pro with M3 chip delivers exceptional performance and battery life. Perfect for developers and creative professionals.',
        brand: 'Apple',
        processor: 'Apple M3 Chip',
        ram: '16GB Unified Memory',
        storage: '1TB SSD',
        screenSize: '14.2 inch',
        graphics: 'Apple M3 GPU',
        operatingSystem: 'macOS Sonoma',
        category: 'Business Laptop',
        seller: 'Apple Authorized Reseller',
        stock: 15,
        ratings: 4.8,
        numOfReviews: 0,
        reviews: []
    },
    {
        name: 'HP Pavilion Gaming 15',
        price: 48594.00,
        description: 'Affordable gaming laptop with powerful specs. Features dedicated NVIDIA graphics and high refresh rate display for smooth gaming.',
        brand: 'HP',
        processor: 'AMD Ryzen 7 5800H',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3060',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'HP Official Store',
        stock: 30,
        ratings: 4.3,
        numOfReviews: 0,
        reviews: []
    },
    {
        name: 'Lenovo ThinkPad X1 Carbon Gen 11',
        price: 91794.00,
        description: 'Ultra-lightweight business laptop with military-grade durability. Perfect for professionals who need reliability and performance on the go.',
        brand: 'Lenovo',
        processor: 'Intel Core i7 13th Gen',
        ram: '32GB DDR5',
        storage: '1TB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Pro',
        category: 'Business Laptop',
        seller: 'Lenovo Business',
        stock: 20,
        ratings: 4.6,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'ASUS ROG Strix G16',
        price: 107994.00,
        description: 'High-performance gaming laptop with RGB keyboard and advanced cooling system. Dominate your games with top-tier specs.',
        brand: 'ASUS',
        processor: 'Intel Core i9 13th Gen',
        ram: '32GB DDR5',
        storage: '1TB SSD',
        screenSize: '16 inch',
        graphics: 'NVIDIA GeForce RTX 4070',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'ASUS ROG Store',
        stock: 12,
        ratings: 4.7,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Acer Chromebook Spin 714',
        price: 35094.00,
        description: 'Premium Chromebook with 2-in-1 design. Perfect for students and web-based workflows with long battery life.',
        brand: 'Acer',
        processor: 'Intel Core i5 12th Gen',
        ram: '8GB DDR4',
        storage: '256GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Chrome OS',
        category: 'Chromebooks',
        seller: 'Acer Official',
        stock: 40,
        ratings: 4.2,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'MSI Creator Z16',
        price: 124194.00,
        description: 'Content creator focused laptop with stunning QHD+ display and powerful specs for video editing and 3D rendering.',
        brand: 'MSI',
        processor: 'Intel Core i9 12th Gen',
        ram: '32GB DDR5',
        storage: '2TB SSD',
        screenSize: '16 inch',
        graphics: 'NVIDIA GeForce RTX 3070 Ti',
        operatingSystem: 'Windows 11 Pro',
        category: 'Business Laptop',
        seller: 'MSI Creator Series',
        stock: 8,
        ratings: 4.6,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Microsoft Surface Laptop 5',
        price: 70194.00,
        description: 'Sleek and stylish laptop with premium build quality and PixelSense touchscreen display. Perfect for productivity and creativity.',
        brand: 'Microsoft',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '13.5 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Home',
        category: 'Convertible Laptops',
        seller: 'Microsoft Store',
        stock: 18,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Razer Blade 15',
        price: 118800.00,
        description: 'Premium gaming laptop with sleek aluminum chassis and powerful specs. Perfect balance of portability and performance.',
        brand: 'Razer',
        processor: 'Intel Core i7 13th Gen',
        ram: '16GB DDR5',
        storage: '1TB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 4060',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'Razer Official',
        stock: 10,
        ratings: 4.6,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'HP Envy x360',
        price: 64800.00,
        description: '2-in-1 convertible laptop with touchscreen. Versatile design for work and entertainment.',
        brand: 'HP',
        processor: 'AMD Ryzen 7 5800U',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'AMD Radeon Graphics',
        operatingSystem: 'Windows 11 Home',
        category: 'Convertible Laptops',
        seller: 'HP Official Store',
        stock: 28,
        ratings: 4.4,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Lenovo Legion 5 Pro',
        price: 91800.00,
        description: 'Gaming laptop with QHD display and high refresh rate. Excellent cooling and performance.',
        brand: 'Lenovo',
        processor: 'AMD Ryzen 7 6800H',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '16 inch',
        graphics: 'NVIDIA GeForce RTX 3070',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'Lenovo Gaming',
        stock: 16,
        ratings: 4.7,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'ASUS Chromebook Flip CX5',
        price: 45900.00,
        description: 'Powerful Chromebook with convertible design and military-grade durability. Great for productivity.',
        brand: 'ASUS',
        processor: 'Intel Core i5 11th Gen',
        ram: '8GB DDR4',
        storage: '128GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel UHD Graphics',
        operatingSystem: 'Chrome OS',
        category: 'Chromebooks',
        seller: 'ASUS Official',
        stock: 35,
        ratings: 4.3,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Dell Latitude 7430',
        price: 75600.00,
        description: 'Business-class laptop with enterprise security features. Built for professionals who demand reliability.',
        brand: 'Dell',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Pro',
        category: 'Business Laptop',
        seller: 'Dell Business',
        stock: 22,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Acer Predator Helios 300',
        price: 81000.00,
        description: 'Popular gaming laptop with aggressive design and solid performance. Great value for gamers.',
        brand: 'Acer',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3060',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'Acer Predator',
        stock: 24,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'MacBook Air M2',
        price: 70200.00,
        description: 'Thin, light, and powerful. The redesigned MacBook Air with M2 chip is perfect for everyday tasks.',
        brand: 'Apple',
        processor: 'Apple M2 Chip',
        ram: '8GB Unified Memory',
        storage: '256GB SSD',
        screenSize: '13.6 inch',
        graphics: 'Apple M2 GPU',
        operatingSystem: 'macOS Ventura',
        category: 'Business Laptop',
        seller: 'Apple Authorized Reseller',
        stock: 32,
        ratings: 4.7,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Lenovo Yoga 9i',
        price: 86400.00,
        description: 'Premium 2-in-1 convertible with rotating soundbar hinge and stunning OLED display.',
        brand: 'Lenovo',
        processor: 'Intel Core i7 13th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Home',
        category: 'Convertible Laptops',
        seller: 'Lenovo Premium',
        stock: 18,
        ratings: 4.6,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'ASUS TUF Gaming F15',
        price: 59400.00,
        description: 'Durable gaming laptop with military-grade construction. Reliable performance for gaming and multitasking.',
        brand: 'ASUS',
        processor: 'Intel Core i5 12th Gen',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3050',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'ASUS TUF Store',
        stock: 38,
        ratings: 4.4,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'HP Chromebook x360 14',
        price: 32400.00,
        description: '2-in-1 Chromebook with touchscreen and long battery life. Perfect for students and cloud users.',
        brand: 'HP',
        processor: 'Intel Pentium Gold',
        ram: '4GB DDR4',
        storage: '64GB eMMC',
        screenSize: '14 inch',
        graphics: 'Intel UHD Graphics',
        operatingSystem: 'Chrome OS',
        category: 'Chromebooks',
        seller: 'HP Official Store',
        stock: 45,
        ratings: 4.1,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'MSI Katana GF66',
        price: 54000.00,
        description: 'Entry-level gaming laptop with samurai-inspired design. Good performance at an affordable price.',
        brand: 'MSI',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR4',
        storage: '512GB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3050 Ti',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'MSI Gaming',
        stock: 26,
        ratings: 4.2,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Dell XPS 13 Plus',
        price: 97200.00,
        description: 'Ultra-modern business ultrabook with edge-to-edge keyboard and stunning InfinityEdge display.',
        brand: 'Dell',
        processor: 'Intel Core i7 13th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '13.4 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Pro',
        category: 'Business Laptop',
        seller: 'Dell Official Store',
        stock: 20,
        ratings: 4.6,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Samsung Galaxy Chromebook 2',
        price: 37800.00,
        description: 'Stunning QLED display Chromebook with premium design. Great for media consumption and productivity.',
        brand: 'Samsung',
        processor: 'Intel Core i3 10th Gen',
        ram: '8GB DDR4',
        storage: '128GB SSD',
        screenSize: '13.3 inch',
        graphics: 'Intel UHD Graphics',
        operatingSystem: 'Chrome OS',
        category: 'Chromebooks',
        seller: 'Samsung Store',
        stock: 30,
        ratings: 4.3,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'ASUS ZenBook Flip 14',
        price: 62100.00,
        description: 'Compact 2-in-1 convertible with OLED touchscreen and NumberPad 2.0 on trackpad.',
        brand: 'ASUS',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Home',
        category: 'Convertible Laptops',
        seller: 'ASUS Official',
        stock: 25,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Gigabyte AORUS 15',
        price: 97200.00,
        description: 'High-performance gaming laptop with RGB Fusion 2.0 and advanced cooling system.',
        brand: 'Gigabyte',
        processor: 'Intel Core i7 12th Gen',
        ram: '16GB DDR4',
        storage: '1TB SSD',
        screenSize: '15.6 inch',
        graphics: 'NVIDIA GeForce RTX 3070',
        operatingSystem: 'Windows 11 Home',
        category: 'Gaming Laptop',
        seller: 'Gigabyte Gaming',
        stock: 14,
        ratings: 4.5,
        numOfReviews: 0,
        reviews: [],
    },
    {
        name: 'Lenovo ThinkPad X1 Yoga Gen 8',
        price: 102600.00,
        description: 'Premium business convertible with garaged stylus and 360-degree hinge. Perfect for creative professionals.',
        brand: 'Lenovo',
        processor: 'Intel Core i7 13th Gen',
        ram: '16GB DDR5',
        storage: '512GB SSD',
        screenSize: '14 inch',
        graphics: 'Intel Iris Xe',
        operatingSystem: 'Windows 11 Pro',
        category: 'Convertible Laptops',
        seller: 'Lenovo Business',
        stock: 15,
        ratings: 4.7,
        numOfReviews: 0,
        reviews: [],
    }
];

// Default laptop image (placeholder)
const DEFAULT_LAPTOP_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TGFwdG9wIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

const addProducts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected\n');

        // Get all existing products to delete their images from Cloudinary
        console.log('🔍 Fetching existing products...');
        const existingProducts = await Product.find({});
        
        if (existingProducts.length > 0) {
            console.log(`Found ${existingProducts.length} existing products. Deleting images from Cloudinary...\n`);
            
            let deletedImagesCount = 0;
            for (const product of existingProducts) {
                if (product.images && product.images.length > 0) {
                    for (const image of product.images) {
                        try {
                            await cloudinary.v2.uploader.destroy(image.public_id);
                            deletedImagesCount++;
                        } catch (error) {
                            console.log(`⚠️  Failed to delete image: ${image.public_id}`);
                        }
                    }
                }
            }
            console.log(`🗑️  Deleted ${deletedImagesCount} images from Cloudinary\n`);
        }

        // Clear existing products from database
        await Product.deleteMany({});
        console.log('✅ Existing products cleared from database\n');

        console.log('🔄 Adding sample products...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const productData of sampleProducts) {
            try {
                // Initialize images array
                const images = [];

                // Check if product folder exists in product-images directory
                const productFolderPath = path.join(IMAGES_DIR, productData.name);
                
                if (fs.existsSync(productFolderPath)) {
                    // Read all files in the product folder
                    const files = fs.readdirSync(productFolderPath);
                    
                    // Filter for image files
                    const imageFiles = files.filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
                    });

                    if (imageFiles.length > 0) {
                        console.log(`📂 Found ${imageFiles.length} image(s) for ${productData.name}`);
                        
                        // Upload each image to Cloudinary
                        for (const imageFile of imageFiles) {
                            try {
                                const imagePath = path.join(productFolderPath, imageFile);
                                const result = await cloudinary.v2.uploader.upload(imagePath, {
                                    folder: 'products',
                                    crop: "fit",
                                    timeout: 60000
                                });
                                
                                images.push({
                                    public_id: result.public_id,
                                    url: result.secure_url
                                });
                                
                                console.log(`   📸 Uploaded: ${imageFile}`);
                            } catch (uploadError) {
                                console.log(`   ⚠️  Failed to upload ${imageFile}: ${uploadError.message}`);
                            }
                        }
                    } else {
                        console.log(`⚠️  No image files found in folder for ${productData.name}`);
                    }
                } else {
                    console.log(`⚠️  No folder found for ${productData.name}`);
                }

                // If no images were uploaded, use placeholder
                if (images.length === 0) {
                    try {
                        const result = await cloudinary.v2.uploader.upload(DEFAULT_LAPTOP_IMAGE, {
                            folder: 'products',
                            width: 400,
                            crop: "scale",
                            timeout: 60000
                        });
                        images.push({
                            public_id: result.public_id,
                            url: result.secure_url
                        });
                        console.log(`   📸 Using placeholder image`);
                    } catch (uploadError) {
                        console.log(`   ⚠️  Placeholder upload failed`);
                    }
                }

                // Add images to product
                productData.images = images;

                // Create product
                const product = await Product.create(productData);
                console.log(`✅ Added: ${product.name} - ₱${product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (${images.length} image(s))\n`);
                successCount++;

            } catch (error) {
                console.error(`❌ Error adding ${productData.name}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n==========================================');
        console.log('Summary:');
        console.log(`✅ Successfully added: ${successCount} products`);
        console.log(`❌ Failed: ${errorCount} products`);
        console.log('==========================================');

        console.log('\n🎉 Sample products have been added to your database!');
        console.log('\n📝 Next steps:');
        console.log('1. Images are loaded from: backend/scripts/product-images/[Product Name]/');
        console.log('2. Supported formats: .jpg, .jpeg, .png, .webp, .avif');
        console.log('3. Each product can have multiple images in its folder');
        console.log('4. Start your backend: npm run dev');
        console.log('5. Start your frontend: npm run dev');
        console.log('6. Login as admin and navigate to /admin/products\n');

        process.exit(0);
    } catch (error) {
        console.error('Error adding products:', error);
        process.exit(1);
    }
};

addProducts();
