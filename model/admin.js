const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv1 = require("uuid");
const passwordHash = require("password-hash");


const user = new Schema({
    email:{
        type:String,
        required:true
    },
    salt:{
        type:String,
    },
    first_name: {
      type: String
    },
    last_name: {
      type: String
    },
    hash_password:{
        type:String,
        required: true
    },
    access: {
      type: Object
    }
}   
,{
  timestamps : true
  }
);



user.virtual("password")
  .set(function(password) {
    this._password = password;
    this.salt = uuidv1.v1();
    this.hash_password = this.encryptPassword(password);
    //console.log("check", this.salt, this.hashPassword);
  })
  .get(function() {
    return this._password;
  });

  user.methods = {
  authentication: function(password) {
    return passwordHash.verify(password, this.hash_password);
  },
  encryptPassword: function(password) {
    if (!password) {
      return "";
    }
    try {
      return passwordHash.generate(password);
    } catch (error) {
      console.log(error);
      return "";
    }
  }
};



module.exports = mongoose.model('admin', user);