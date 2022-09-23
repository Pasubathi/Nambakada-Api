const mongoose = require("mongoose");
const { STATES } = require("mongoose");
const Schema = mongoose.Schema;

const order = new Schema(
  {
    order_no: { type: Number, required: true },
    product_id: { type: mongoose.Types.ObjectId, ref: "product" },
    quantity: Number,
    price: Number,
    image: String,
    shipping_rate: Number,
    hopeup_buyerFee: Number,
    hopeup_sellerFee: Number,
    seller_money: Number,
    chargeId: String,
    total: Number,
    name: String,
    city: String,
    state: String,
    address: String,
    zip: String,
    country: String,
    phone: String,
    shipping_method: String,
    shipping_service: String,
    deliveryDate: String,
    order_status: {
      type: String,
      default: "incomplete",
    },
    seller_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    buyer_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    track_id: {
      type: String,
    },
    paid: {
      type: Boolean,
      default: false
    },
    return: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("order", order);
