const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const marketing = new Schema({
  images: {
    type: Array,
  },
}, {
  timestamps: true,
})

module.exports = mongoose.model("marketing", marketing);