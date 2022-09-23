const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const billing = new Schema({
    user_id : {
        type :mongoose.Types.ObjectId,
        ref : "user"
    },
    first_name: {
        type :String,
        required: true
    },
    last_name:{
        type:String,
        required :true
    },
    email : {
        type : String , 
        required : true
    } , 
    address : {
        type : String 
    },
    city : {
        type : String 
    },
    state : {
        type : String 
    },
    postal_code : {
        type : Number
    },
    country : {
        type : String
    },
    order_ids : [{
        type :mongoose.Types.ObjectId,
        ref : "order" 
    }]
    
},{
    timestamps : true
    }
);


module.exports = mongoose.model('billingDetail',billing );
