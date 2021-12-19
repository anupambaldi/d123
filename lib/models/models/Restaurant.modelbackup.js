const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const RestaurantSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        alias: {
            type: String,
            required: true,
            trim: true
        },
        image_url: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        categories : [{
            type: Schema.Types.ObjectId,
            ref: 'Categories'
        }],
        rating: {
            type: Number,
            required: true,
            trim: true
        },
        coordinates : [{ 
            latitude: String, 
            longitude: String 
        }],
        transactions  : [{ 
            delivery: String, 
            pickup: String 
        }],
        price: {
            type: String,
            required: true,
            trim: true
        },
        // location_id: {
        //     type: Number,
        //     required: true,
        //     trim: true
        // },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        is_closed: {
            type: Boolean,
            default: false
        },
        is_active: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
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

module.exports = mongoose.model('Restaurant', RestaurantSchema);