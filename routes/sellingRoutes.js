const express = require("express");
const Selling = require("../model/selling");
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
    console.log('data', data)
    const schema = Joi.object({
        card_number: Joi.string(),
        account_number: Joi.string().required(),
        bank_name: Joi.string(),
        user_id: Joi.string().required(),
        account_title: Joi.string().required()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let selling_data = await Selling.findOne({ user_id: data.user_id })
            if (selling_data) {

                selling_data["card_number"] = data.card_number;
                selling_data["account_number"] = data.account_number;
                selling_data["bank_name"] = data.bank_name;
                selling_data['account_title'] = data.account_title;
                selling_data.save();
                return res.status(200).json(selling_data);
            }
            let selling = new Selling(data);
            selling.save((err, prod) => {
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


router.put("/:selling_id", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const { selling_id } = req.params;
    const schema = Joi.object({
        card_number: Joi.string(),
        account_number: Joi.string().required(),
        bank_name: Joi.string(),
        user_id: Joi.string().required(),
        account_title: Joi.string().required()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {

            let selling = await Selling.findByIdAndUpdate(selling_id, {
                $set: data
            }, { new: true });
            res.status(200).json(selling);
        }
    } catch (err) {
        res.status(400).json(err.message);
    }
})


router.get("/:user_id", middlewear.checkToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        let selling = await Selling.findOne({ user_id: user_id });
        res.status(200).json(selling);
    } catch (err) {
        res.status(400).json(err.message)
    }
});

module.exports = router;
