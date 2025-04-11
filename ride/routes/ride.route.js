const express = require('express');
const router = express.Router();
const userAuthorization = require('../middlewares/auth.middleware');
const rideController = require('../controllers/ride.controller');

router.post('/create', userAuthorization.userAuth, rideController.createRide);
router.post('/confirm', userAuthorization.captainAuth, rideController.confirmRide);

module.exports = router;