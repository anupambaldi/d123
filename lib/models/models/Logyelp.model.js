const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const LogyelpSchema = new Schema(
    {
        loc: {
            type: { type: String, default: 'Point' },
            coordinates: [{
                type: Number
            }]
        },
        lat: {
            type: Number
        },
        long:{
            type: Number
        },
        radius:{
            type: Number
        }
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated'
        },
        id: false,
        toJSON: {
            getters: true
        },
        toObject: {
            getters: true
        }
    }
);

module.exports = mongoose.model('Logyelp', LogyelpSchema);