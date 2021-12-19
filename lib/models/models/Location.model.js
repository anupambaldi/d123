const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
const LocationSchema = new Schema(
    {
        restaurant_id:{
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Restaurant'
        },
        address1: {
            type: String,
            required: true
        },
        address2: {
            type: String,
            required: true
        },
        address3: {
            type: String,
            required: true
        },
        zip_code: {
            type: Number,
            required: true
        },
        country: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
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
        },
    }
);

module.exports = mongoose.model('Location', LocationSchema);