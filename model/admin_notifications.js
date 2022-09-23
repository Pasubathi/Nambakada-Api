var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var admin_notification = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order"
  },
  return_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "return"
  },
  viewed: {
    type: Boolean,
    default: false
  },
  notification_type: {
    type: String,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('admin_notification', admin_notification);