const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/logout', authMiddleware.userAuth, userController.logout);
router.get('/profile', authMiddleware.userAuth, userController.profile);
router.post('/requestRide', authMiddleware.userAuth, userController.requestRide);

module.exports = router;