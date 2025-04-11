const rideModel = require('../models/ride.model');
const { publishToQueue } = require('../services/rabbit');
const { subscribeToQueue } = require('../services/rabbit');

module.exports.createRide = async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    const ride = await rideModel.create({
        pickup,
        destination,
        user: req.user._id
    });

    if(!ride) {
      return res.status(400).json({ message: 'Ride creation failed' });
    }

    publishToQueue('new-ride', JSON.stringify(ride));
    
    return res.status(201).json({ message: 'Ride created successfully', ride });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating ride', error });
  }
}

module.exports.confirmRide = async (req, res) => {
  const { rideId, captainId } = req.body;
  if (!rideId || !captainId) {
      return res.status(400).json({ message: 'Ride ID and Captain ID are required' });
  }
  try {
      const ride = await rideModel.findById(rideId);
      if (!ride) {
          return res.status(404).json({ message: 'Ride not found' });
      }
      if (ride.status === 'accepted') {
          return res.status(400).json({ message: 'Ride is already accepted' });
      }
      ride.status = 'accepted';
      ride.captain = captainId;  
      await ride.save();
      publishToQueue('ride-accepted', JSON.stringify(ride));
      res.json(ride);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
}