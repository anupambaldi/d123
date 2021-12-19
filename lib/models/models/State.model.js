const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
const StateSchema = new Schema(
    {
        country_id: {
            type: Schema.Types.ObjectId,
            ref: 'Country'
        },
        name: {
            type: String
        },
        is_active: {
            type: Boolean
        },
        is_hide: {
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

module.exports = mongoose.model('State', StateSchema);