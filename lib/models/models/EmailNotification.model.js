const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const EmailNotificationSchema = new Schema(
    {
        notification:{
            type: String
        },
        isDeleted:{
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



module.exports = mongoose.model('EmailNotification', EmailNotificationSchema);