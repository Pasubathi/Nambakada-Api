const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const featured = new Schema(
  {
    images: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("featured", featured);