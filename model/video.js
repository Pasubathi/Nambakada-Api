const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const video = new Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    video: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: mongoose.Types.ObjectId,
        ref: "tag",
      },
    ],
    likes: {
      type: Array,
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Array,
    },
    poster: {
      type: String,
      required: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("video", video);
