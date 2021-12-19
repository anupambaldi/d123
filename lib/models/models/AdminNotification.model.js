const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');


const AdminNotificationSchema = new Schema(
    {
        notification_title:{
            type: String
        },
        description:{
            type: String
        },
        recieverId:{
            type: Schema.Types.ObjectId,
            ref: 'User'
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



module.exports = mongoose.model('AdminNotification', AdminNotificationSchema);