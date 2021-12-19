const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const TempMobileSchema = new Schema(
    {
        countryCode: {
            type: String,
            trim: true
        },
        mobile:{
            type: String,
            trim: true
        },
        otp:{
            type:String,
            default:""
        },
        isVerify: {
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
    });

module.exports = mongoose.model('TempMobile', TempMobileSchema);