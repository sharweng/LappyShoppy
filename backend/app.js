const express = require('express');
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser')

const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const upload = require('./routes/upload');
const deactivate = require('./routes/deactivate');
const admin = require('./routes/admin');

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:4001',  // Local build
            'http://localhost:3000',  // Local development frontend
            'http://localhost:5173',  // Vite dev server
            'https://lappyshoppy.onrender.com',  // Deployed frontend
            'https://lappyshoppy-frontend.onrender.com',  // Alternative deployed URL
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(cookieParser());


app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1/upload', upload);
app.use('/api/v1', deactivate);
app.use('/api/v1', admin);






module.exports = app