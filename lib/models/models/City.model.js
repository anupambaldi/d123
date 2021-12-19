const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
const CitySchema = new Schema(
    {
        state: {
            type: Schema.Types.ObjectId,
            ref: "State"
        },
        city: {
            type: String
        },
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

module.exports = mongoose.model('City', CitySchema);