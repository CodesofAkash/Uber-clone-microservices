const express = require('express');
const router = express.Router();
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', captainController.register);
router.post('/login', captainController.login);
router.get('/logout', authMiddleware.captainAuth, captainController.logout);
router.get('/profile', authMiddleware.captainAuth, captainController.profile);
router.patch('/toggleAvailability', authMiddleware.captainAuth, captainController.toggleAvailability);
router.post('/waitForNewRide', authMiddleware.captainAuth, captainController.waitForNewRide);
router.post('/acceptRide', authMiddleware.captainAuth, captainController.acceptRide);

module.exports = router;