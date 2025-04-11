const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select: false,
        required: true
    },
    vehicle: {
        type : {
            type: String,
            required: true,
            enum: ['car', 'bike', 'auto']
        },
        number: {
            type: String,
            required: true
        }
    },
    isAvailable: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('captain', captainSchema);