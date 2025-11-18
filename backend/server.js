const app = require('./app');
const connectDatabase = require('./config/database')
const cloudinary = require('cloudinary');
const admin = require('./config/firebase');
const path = require('path');
const express = require('express');

const dotenv = require('dotenv');
dotenv.config({path: './config/.env'})

connectDatabase();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

if(process.env.NODE_ENV === "PRODUCTION"){
    const clientDistPath = path.join(__dirname, '..', 'frontend', 'dist');

    app.use(express.static(clientDistPath));

    // catch-all middleware (no path pattern) to serve index.html
    app.use((req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

app.listen(process.env.PORT, () => {
	console.log(`server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});