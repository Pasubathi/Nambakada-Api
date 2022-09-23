const express = require("express");
const Buying = require("../model/buying");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const Product = require("../model/product");
const crypto = require('crypto');
const Tag = require('../model/Tag');
const multer = require("multer");
const multerS3 = require('multer-s3');
const fs = require("fs")
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        card_number: Joi.string().required(),
        name: Joi.string().required(),
        expiration_date: Joi.string().required(),
        cvv: Joi.string().required(),
        user_id: Joi.string().required(),
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let buying_data = await Buying.findOne({ user_id: data.user_id })
            if (buying_data) {
                buying_data["card_number"] = data.card_number;
                buying_data["name"] = data.name;
                buying_data["expiration_date"] = data.expiration_date;
                buying_data["cvv"] = data.cvv;

                return res.status(200).json(buying_data);
            }
            let buying = new Buying(data);
            buying.save((err, prod) => {
                if (!err) {
                    res.status(200).json(prod);
                }
                else {
                    res.status(400).json(err);
                }
            })
        }
    } catch (err) {
        console.log(err)
        res.status(400).json(err.message);
    }
})


router.put("/:buying_id", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const { buying_id } = req.params;
    const schema = Joi.object({
        card_number: Joi.string().required(),
        name: Joi.string().required(),
        expiration_date: Joi.string().required(),
        cvv: Joi.string().required(),
        user_id: Joi.string().required(),

    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {

            let buying = await Buying.findByIdAndUpdate(buying_id, {
                $set: data
            }, { new: true });
            res.status(200).json(buying);
        }
    } catch (err) {
        res.status(400).json(err.message);
    }
})


router.get("/:user_id", middlewear.checkToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        let buying = await Buying.findOne({ user_id: user_id });
        res.status(200).json(buying);
    } catch (err) {
        res.status(400).json(err.message)
    }
});

module.exports = router;
