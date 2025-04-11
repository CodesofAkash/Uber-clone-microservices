require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const connect = require('./db/db');
const rabbitMq = require('./services/rabbit');

const ridesRouter = require('./routes/ride.route');

const app = express();

connect();
rabbitMq.connectRabbitMQ();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', ridesRouter);

module.exports = app;