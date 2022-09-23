const mongoose = require('mongoose');
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
    favourite_type : {
        type: String,
        required: true
    }
},{
    timestamps : true
});


module.exports = mongoose.model('favourite',product );
