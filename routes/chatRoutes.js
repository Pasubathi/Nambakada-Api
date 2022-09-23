const express = require("express");
const User = require("../model/user");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const Product = require("../model/product");
const crypto = require('crypto');
const Chat = require('../model/chat');


router.get("/all_message/:user_id", middlewear.checkToken, async (req, res) => {
    const { user_id } = req.params
    try {
        let message = await Chat.aggregate([
            { $sort: { _id: -1 } },
            {
                $group: {
                    _id: '$message_id',
                    "docs": {
                        $first: {
                            "_id": "$_id",
                            "receiver_id": "$receiver_id",
                            "sender_id": "$sender_id",
                            "message": "$message",
                            "image": "$image",
                            "createdAt": "$createdAt",
                            "updatedAt": "$updatedAt",
                            "message_id": "$message_id",
                            "read": "$read"
                        }
                    }
                }
            },
        ])
        let messages = [];
        let arr2 = [];
        let read = false;
        if (message.length == 0) {
            return res.status(200).json({ error: false, message: "No Message Found" })
        }
        for (let i = 0; i < message.length; i++) {
            if (message[i].docs.sender_id == user_id || message[i].docs.receiver_id == user_id) {
                read = message[i].docs.read;
                if (!read) {
                    arr2.push(read)
                }
                let user = await User.findOne({ _id: message[i].docs.sender_id })
                let receiver = await User.findOne({ _id: message[i].docs.receiver_id })
                if (arr2.length) {
                    messages = [...messages, { message: message[i].docs, user: user, receiver, read: false }]
                    arr2 = [];
                } else {
                    messages = [...messages, { message: message[i].docs, user: user, receiver, read: true }]
                    arr2 = [];
                }
            }
        }
        const sortedMessages = messages.sort((a, b) => +new Date(b.message.createdAt) - +new Date(a.message.createdAt));
        // const sortbyunread = sortedMessages.sort((a, b) => { return (a.read === b.read) ? 0 : a ? 1 : -1 });
        return res.status(200).json(sortedMessages)
    } catch (err) {
        console.log(err, "ERR")
        return res.status(400).json(err)
    }
});


router.get("/", middlewear.checkToken, async (req, res) => {
    console.log("running", req.query)
    const sender_id = req.query.sender_id;
    const receiver_id = req.query.receiver_id;
    let message_id = await generate_id(receiver_id, sender_id);

    let chat = await Chat.find({ message_id: message_id });
    res.status(200).json(chat);
})


router.get("/message/:message_id", middlewear.checkToken, async (req, res) => {
    const { message_id } = req.params;
    try {
        let chat = await Chat.find({ message_id: message_id });
        res.status(200).json(chat)
    } catch (err) {
        res.status(400).json(err)
    }
})

function generate_id(receiver_id, sender_id) {
    receiver_id = receiver_id.substring(19, 24);
    sender_id = sender_id.substring(19, 24);
    let message_id = receiver_id + sender_id;
    const sorted = message_id.split('').sort().join('')
    return sorted
}


router.post("/check", middlewear.checkToken, async (req, res) => {
    const data = req.body
    let message_id = await generate_id(data.receiver_id, data.sender_id);
    let chat = new Chat({
        receiver_id: data.receiver_id,
        sender_id: data.sender_id,
        message_id: message_id,
        message: "new"
    })
    chat.save();
    console.log("index", chat)
    res.status(200).json(chat)
})



module.exports = router;
