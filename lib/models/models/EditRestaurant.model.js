const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const EditRestaurant = new Schema(
    {
        restaurantId:{
            type: Schema.Types.ObjectId,
            ref: 'Restaurant'
        },
        phone:{
            type: Boolean
        },
        url:{
            type: Boolean
        },
        name:{
            type: Boolean
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



module.exports = mongoose.model('EditRestaurant', EditRestaurant);