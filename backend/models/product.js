const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        maxLength: [5, 'Product name cannot exceed 5 characters'],
        default: 0.0
    },
    description: {
        type: String,
        required: [true, 'Please enter product description'],
    },
    // Laptop-specific fields
    brand: {
        type: String,
        required: [true, 'Please enter laptop brand']
    },
    processor: {
        type: String,
        required: [true, 'Please enter processor details']
    },
    ram: {
        type: String,
        required: [true, 'Please enter RAM size']
    },
    storage: {
        type: String,
        required: [true, 'Please enter storage details']
    },
    screenSize: {
        type: String,
        required: [true, 'Please enter screen size']
    },
    graphics: {
        type: String,
        default: 'Integrated'
    },
    operatingSystem: {
        type: String,
        default: 'Windows 11'
    },
    ratings: {
        type: Number,
        default: 0
    },
    
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            },
        }
    ],
    category: {
        type: String,
        required: [true, 'Please select category for this product'],
        enum: {
            values: [
                'Business Laptop',
                'Gaming Laptop',
                'Chromebooks',
                'Convertible Laptops'
            ],
            message: 'Please select correct category for product'
        }
    },
    seller: {
        type: String,
        required: [true, 'Please enter product seller']
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        maxLength: [5, 'Product name cannot exceed 5 characters'],
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            username: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: false,
                default: ''
            },
            isAnonymous: {
                type: Boolean,
                default: false
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
       
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Product', productSchema);