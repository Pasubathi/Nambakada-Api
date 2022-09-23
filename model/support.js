const mongoose = require('mongoose');
const string = require('@hapi/joi/lib/types/string');
const Schema = mongoose.Schema;

const support = new Schema({
  user_id: {
    type: String,
    required: true
  },
  group_id: {
    type: mongoose.Types.ObjectId,
    ref: "help_center",
  },
  message: {
    type: String,
  },
  message_id: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
  image: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false
  },
  expired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
}
);


module.exports = mongoose.model('support', support);
