const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uuidv1 = require("uuid");
const passwordHash = require("password-hash");
const { any } = require("@hapi/joi");

const user = new Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    salt: {
      type: String,
    },
    hash_password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    reset_password_expires: {
      type: Date,
    },
    reset_password_token: {
      type: String,
    },
    profile_picture: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    notification: {
      type: Boolean,
      default: true,
    },
    email_notification: {
      type: Boolean,
      default: true,
    },
    isLoggedin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

user
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1.v1();
    this.hash_password = this.encryptPassword(password);
    //console.log("check", this.salt, this.hashPassword);
  })
  .get(function () {
    return this._password;
  });

user.methods = {
  authentication: function (password) {
    return passwordHash.verify(password, this.hash_password);
  },
  encryptPassword: function (password) {
    if (!password) {
      return "";
    }
    try {
      return passwordHash.generate(password);
    } catch (error) {
      console.log(error);
      return "";
    }
  },
};

module.exports = mongoose.model("user", user);
