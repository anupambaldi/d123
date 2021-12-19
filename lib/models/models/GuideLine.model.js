const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const GuideLineSchema = new Schema(
    {
        type: {
            type: String,
            trim: true,
        },
        guideLine: {
            type: String,
            trim: true,
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

module.exports = mongoose.model('GuideLine', GuideLineSchema);
