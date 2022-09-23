var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    title:{
        type :String,
        required : true, 
    },
    body :{
        type :String,
         
    },
    product_id : {
        type:mongoose.Schema.Types.ObjectId,
        ref: "product"
    },
    video_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "video"
    },
    adv_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "adv"
    },
    notification_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    viewed:{
        type : Boolean,
        default : false
    },
    notification_type: {
        type : String,
        
    }


    
},{
    timestamps : true
    });

module.exports = mongoose.model('notification', notificationSchema);