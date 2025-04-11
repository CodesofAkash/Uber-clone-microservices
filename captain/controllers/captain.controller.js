const captainModel = require('../models/captain.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklisttoken.model');
const { subscribeToQueue } = require('../services/rabbit');
const { publishToQueue } = require('../services/rabbit');
const axios = require('axios');

module.exports.register = async (req, res) => {
    try {
        const { name, email, password, vehicle } = req.body;
        const captain = await captainModel.findOne({ email });

        if(captain) {
            return res.status(400).json({ message: 'Captain already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newCaptain = await captainModel.create({ name, email, password: hashedPassword, vehicle });

        const token = jwt.sign({ id: newCaptain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);
        delete newCaptain._doc.password;
        res.status(201).send({ message: 'Captain registered successfully', token, newCaptain });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const captain = await captainModel.findOne({ email }).select('+password');

        if(!captain) {
            res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, captain.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, {expiresIn: '1h'});

        res.cookie('token', token);
        delete captain._doc.password;
        res.status(200).send({ message: 'Login successful', token, captain });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        await blacklistModel.create({ token });
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.profile = async (req, res) => {
    try {
        res.json(req.captain);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.toggleAvailability = async (req, res) => {
    try {
        const captain = await captainModel.findOne({ _id: req.captain._id});
        if(!captain) {
            return res.status(404).json({ message: 'Captain not found' });
        }
        captain.isAvailable = !captain.isAvailable;
        await captain.save();
        delete captain._doc.password;
        res.send({ message: 'Availability toggled successfully', captain });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const pendingRequests = [];

module.exports.waitForNewRide = async (req, res) => {
    req.setTimeout(30000, () => {
        res.status(204).end();
    })
    pendingRequests.push(res);
};

subscribeToQueue('new-ride', (data) => {
    const rideData = JSON.parse(data);

    pendingRequests.forEach(res => {
        res.json(rideData);
    });

    pendingRequests.length = 0;
});

module.exports.acceptRide = async (req, res) => {
    try {
        const { rideId } = req.body;
        const captain = await captainModel.findOne({ _id: req.captain._id });
        if(!captain) {
            return res.status(404).json({ message: 'Captain not found' });
        }
        if(!captain.isAvailable) {
            return res.status(400).json({ message: 'Captain is not available' });
        }
        const response = await axios.post(`${process.env.BASE}/ride/confirm`, {
            rideId,
            captainId: captain._id
        }, {
            headers: {
                Authorization: `Bearer ${req.headers.authorization && req.headers.authorization.split(' ')[1]}`
            }
        });
        console.log("ride : ", response.data);
        res.status(200).json({ message: 'Ride accepted successfully', ride: response.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}