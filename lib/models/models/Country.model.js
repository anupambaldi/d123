const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
const CountrySchema = new Schema(
    {
        city: {
            type: String
        },
        code: {
            type: Number
        },
        country: {
            type: String
        },
        is_active: {
            type: Number
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

module.exports = mongoose.model('Country', CountrySchema);