const mongoose = require('mongoose');
const string = require('@hapi/joi/lib/types/string');
const Schema = mongoose.Schema;

const chat = new Schema({
    sender_id: {
        type: String,
        required: true
    },
    receiver_id: {
        type: String,
        required: true
    },
    message: {
        type: String,

    },
    message_id: {
        type: String,
        required: true
    },

    image: {
        type: String,
    },
    read: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
}
);


module.exports = mongoose.model('chat', chat);
