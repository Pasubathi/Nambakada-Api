const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const product = new Schema({
    name : {
        type : String,
        required: true
    },
    image : {
        type :String,

    },
    quantity:{
        type:Number,
        required : true
    },
    price:{
        type:Number,
        required:true
    },
    total:{
        type:Number,
        required:true
    },
  
    user_id:{
        type : mongoose.Types.ObjectId,
        ref : "user"
    },
    product_id  : {
        type : mongoose.Types.ObjectId,
        ref : "product"
    },
    seller_id:{
        type : mongoose.Types.ObjectId,
        ref : "user"
    }

},{
    timestamps : true
});


module.exports = mongoose.model('cart',product );
