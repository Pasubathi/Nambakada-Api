const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const selling = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    account_title: {
        type: String,
        required: true
    },
    account_number: {
        type: String,
        required: true
    },
    bank_name: {
        type: String,
        required: true
    },
    card_number: {
        type: String,
        required: true
    },
}, {
    timestamps: true
}
);


module.exports = mongoose.model('sellingdetails', selling);
