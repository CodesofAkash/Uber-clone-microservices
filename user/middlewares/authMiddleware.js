const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklisttoken.model');
const userModel = require('../models/user.model');

module.exports.userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        if(!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id);

        if(!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}