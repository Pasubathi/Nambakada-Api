const mongoose = require('mongoose');
const number = require('@hapi/joi/lib/types/number');
const Schema = mongoose.Schema;

const product = new Schema({
    
    user_id:{
        type : mongoose.Types.ObjectId,
        ref : "user"
    },
    product_id : {
        type : mongoose.Types.ObjectId,
        ref : "product"
    },
    video_id : {
        type : mongoose.Types.ObjectId,
        ref : "video"
    } ,
    adv_id : {
        type : mongoose.Types.ObjectId,
        ref : "adv"
    },
    flag_type : {
        type: String,
        required: true
    },
    category:{
        type:Number
    }
},{
    timestamps : true
});


module.exports = mongoose.model('flag',product );
