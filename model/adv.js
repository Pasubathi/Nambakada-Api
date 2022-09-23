const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adv = new Schema(
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
    images: {
      type: Array,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
    },
    category: {
      type: String,
    },
    expired: {
      type: Boolean,
      default: true,
    },
    charge: {
      type: Object
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
    sub_category: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Array,
    },
    deleteDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("adv", adv);
