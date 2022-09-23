const mongoose = require('mongoose');
const { array } = require('../s3');
const Schema = mongoose.Schema;

const product = new Schema({
    images: {
        type: Array,

    },
    description: {
        type: String,

    },
    order_id: {
        type: mongoose.Types.ObjectId,
        ref: "order"

    },
    product_id: {
        type: mongoose.Types.ObjectId,
        ref: "product"

    },
    seller_id: {
        type: mongoose.Types.ObjectId,
        ref: "user"

    },
    buyer_id: {
        type: mongoose.Types.ObjectId,
        ref: "user"

    },
    chargeId: {
        type: String
    },
    deleted: {
        type: Boolean,
        default: false
    },
    return_status: {
        type: String,
        default: "pending"
    },
    return_Delivery: {
        type: String,
        default: "incomplete"
    },
    deliveryDate: String,
    admin_description: {
        type: String
    },
    track_id: {
        type: String
    },
    paid: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('return', product);
