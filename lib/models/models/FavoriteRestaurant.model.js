const mongoose = require('mongoose'),
Schema = mongoose.Schema,
bcrypt = require('bcrypt');


const FavoriteRestaurantSchema = new Schema(
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

module.exports = mongoose.model('FavoriteRestaurant', FavoriteRestaurantSchema);