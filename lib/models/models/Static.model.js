const mongoose = require("mongoose");
 let  Schema = mongoose.Schema;

const Static = new Schema({
   
   page_name:{
        type:String
    },
    slug:{
        type:String
    },

    content:{
        type:String
    }

}, { timestamps: { createdAt: 'created_at', updatedAt:'updated_at' }})

module.exports = mongoose.model("Static", Static);