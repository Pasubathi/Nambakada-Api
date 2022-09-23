const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contribute = new Schema({
    card_id: {
        type: String,
    },
    card_number: {
        type: String,
    },
    contribution: {
        type: Number,
        required: true
    },

    expiration_date: {
        type: Date,
    },
    cvv: {
        type: String,
    },

    email: {
        type: String
    },

    name: {
        type: String
    },

    address: {
        type: Object
    },

    user_id: {
        type: Object,
    },
    contribute_type: {
        type: String
    },
    charge: {
        type: Object
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('contribute', Contribute);
