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
app.use(cors());
app.use(cookieParser());


app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1/upload', upload);
app.use('/api/v1', deactivate);
app.use('/api/v1', admin);






module.exports = app