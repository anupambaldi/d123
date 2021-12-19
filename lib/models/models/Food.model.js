const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const FoodSchema = new Schema(
    {
        categoryId:{
            type: Schema.Types.ObjectId,
            ref: 'Categories'
        },
         restaurantId:{
             type: Schema.Types.ObjectId,
             ref: 'Restaurant'
         },
        
        food_image:{
            type:String
        },
        calories:{
            type:Number
        },
        food_name:{
            type:String
        },
        price:{
            type:Number
        },
        food_type:{
            type:String
        },
        description:{
            type:String
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
    }
);



module.exports = mongoose.model('Food', FoodSchema);