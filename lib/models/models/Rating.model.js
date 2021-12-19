const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const RatingSchema = new Schema(
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
        starrating: {
            type: Number,
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        status: {
            type: Boolean,
            default: true
        },
        image: {
            type: Array
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

module.exports = mongoose.model('Rating', RatingSchema);