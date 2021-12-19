const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const LikeDislikeSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Categories'
        },
        like: {
            type: Boolean,
            required: true
            //default:1
        },
        dislike: {
            type: Boolean,
            required: true
            //default:0
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

module.exports = mongoose.model('LikeDislike', LikeDislikeSchema);