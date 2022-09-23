const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buying = new Schema({
    user_id : {
        type :mongoose.Types.ObjectId,
        ref : "user"
    },
    card_number: {
        type :String,
        required: true
    },
    name:{
        type:String,
        required :true
    },
    expiration_date : {
        type : Date,
        required :true 
       
    },
    cvv: {
        type :String,
        required: true
    }
    
},{
    timestamps : true
    }
);


module.exports = mongoose.model('buyingdetails',buying );
