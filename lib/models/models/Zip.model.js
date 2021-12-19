const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const ZipSchema = new Schema(
    {
       
        stateCode: {
            type: String
        },
        cityName: {
            type: String
        },
        state: {
            type: String
        },
        zipCode: {
            type: String
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
       
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated',
        },
        id: false,
        toJSON: {
            getters: true,
        },
        toObject: {
            getters: true,
        },
    }
);

module.exports = mongoose.model('Zip', ZipSchema);
