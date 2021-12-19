const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const RestaurantSchema = new Schema(
    {
        yelp_id: {
            type: String,
            unique : true,
            dropDups: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        alias: {
            type: String,
            trim: true
        },
        image_url: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            trim: true
        },
        review_count: {
            type: Number,
            trim: true
        },
        categories : {
            type: Array,
            trim: true
        },
        rating: {
            type: Number,
            trim: true
        },
        loc: {
            type: { type: String, default: 'Point' },
            coordinates: [{
                type: Number
            }]
        },
        transactions  : [{ 
            type: String,
        }],
        price: {
            type: String,
            trim: true
        },
        location: {
            type:  Object,
            blackbox: true,
        },
        phone: {
            type: String,
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
        },
        is_favorite: {
            type: Boolean,
            default: false
        },
        is_going: {
            type: Boolean,
            default: false
        },
        additional_image_url: {
            type: Array,
            trim: true
        },
        distance: {
            type: Number,
            default : 0
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