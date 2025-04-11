const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklisttoken.model');
const axios = require('axios');
const { subscribeToQueue } = require('../../captain/services/rabbit');

module.exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await userModel.findOne({ email });

        if(user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({ name, email, password: hashedPassword});

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);
        delete newUser._doc.password;
        res.status(201).send({ message: 'User registered successfully', token, newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if(!user) {
            res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {expiresIn: '1h'});

        res.cookie('token', token);
        delete user._doc.password;
        res.status(200).send({ message: 'Login successful', token, user });

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
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.requestRide = async (req, res) => {
    let isResponded = false;
    try {
        const { pickup, destination } = req.body;

        const ride = await axios.post(`${process.env.BASE}/ride/create`, {
            pickup,
            destination,
        }, {
            headers: {
                Authorization: `Bearer ${req.headers.authorization && req.headers.authorization.split(' ')[1]}`,
            }
        })

        if(!ride) {
            isResponded = true;
            return res.status(400).json({ message: 'Ride request failed' });
        }

        const timeout = setTimeout(() => {
            if (!isResponded) {
                isResponded = true;
                res.status(204).end();
            }
        }, 30000);

        subscribeToQueue('ride-accepted', (data) => {
            if (isResponded) return;
            isResponded = true;
            clearTimeout(timeout);
            const rideData = JSON.parse(data);
            res.status(200).json({ message: 'Ride accepted.', rideData });
        })
        
    } catch (error) {
        if (!isResponded) {
            isResponded = true;
            return res.status(500).json({ message: 'Error requesting ride', error });
        }
    }
}