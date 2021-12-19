const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const FaqsSchema = new Schema(
    {
        question: {
            type: String,
            trim: true,
        },
        answer: {
            type: String,
            trim: true,
        },
        type: {
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

module.exports = mongoose.model('Faqs', FaqsSchema);
