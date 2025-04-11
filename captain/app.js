require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const connect = require('./db/db');
const rabbitMq = require('./services/rabbit');

const captainRoutes = require('./routes/captain.route');

connect();
rabbitMq.connectRabbitMQ();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', captainRoutes);

module.exports = app;