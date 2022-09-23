const mongoose = require('mongoose');
const { Schema } = mongoose;

const help_center = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  message: {
    type: String,
  },
  expired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
}
);


module.exports = mongoose.model('help_center', help_center);
