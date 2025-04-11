const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklisttoken.model');
const captainModel = require('../models/captain.model');

module.exports.captainAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization && req.headers.authorization.split(' ')[1];
        if(!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const blacklistedToken = await blacklistModel.findOne({ token });
        if(blacklistedToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const captain = await captainModel.findById(decoded.id);

        if(!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.captain = captain;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}