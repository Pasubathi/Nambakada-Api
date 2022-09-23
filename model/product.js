const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const product = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    weight: {
      type: String,
    },
    length: {
      type: String
    },
    breadth: {
      type: String
    },
    height: {
      type: String
    },
    package: {
      type: String
    },
    price: {
      type: Number,
      required: true,
    },
    likes: {
      type: Array,
      required: true,
    },
    images: {
      type: Array,
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    postal_code: {
      type: String,
    },
    // details: {
    //   type: String,
    // },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    tags: [
      {
        type: mongoose.Types.ObjectId,
        ref: "tag",
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    available: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("product", product);
