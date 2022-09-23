const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const charges = new Schema(
  {
    chargeId: {
      type: String
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    charge_type: {
      type: String
    },
    receiptUrl: {
      type: String
    },
    amount: {
      type: Number
    },
    chargeTypeId: {
      type: mongoose.Types.ObjectId
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("charges", charges);