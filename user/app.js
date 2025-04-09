const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const connect = require('./db/db');

const userRoutes = require('./routes/user.route');

dotenv.config();
connect();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', userRoutes);

module.exports = app;