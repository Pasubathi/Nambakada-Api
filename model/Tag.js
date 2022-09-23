const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const product_tag = new Schema({
    tag : {
        type : String,
        required: true
    },
    object_id : {
        type :String,
        required: true
    },
    tag_type : {
        type : String, 
        required: true
    }
    
},{
    timestamps : true
    });


module.exports = mongoose.model('tag',product_tag );
