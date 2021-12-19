const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const VisitRestaurantSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Restaurant'
        },
        yelp_id: {
            type: String,
            required: true,
            ref: 'Restaurant'
        },
        goinghere: {
            type: Boolean,
            default : 0
        },
        iamhere: {
            type: Boolean,
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

module.exports = mongoose.model('VisitRestaurant', VisitRestaurantSchema);