const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const CustomerSavingSchema = new Schema(
    {
        totalPrice: {
            type: Number,
            default:0
        },
        totalOfferPrice: {
            type: Number,
            default:0
        },
        totalCustomer:{
            type: Number
        }
      
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

module.exports = mongoose.model('CustomerSaving', CustomerSavingSchema);
