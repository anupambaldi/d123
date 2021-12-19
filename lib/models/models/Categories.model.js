const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const CategoriesSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            require: true,
            trim: true
        },
        isSuspended: {
            type: Boolean,
            default: false
        },
        isDeleted: {
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


module.exports = mongoose.model('Categories', CategoriesSchema);