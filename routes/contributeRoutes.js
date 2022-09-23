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
const Contribute = require('../model/contribute')

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        card_number: Joi.string(),
        card_name: Joi.string(),
        amount: Joi.number(),
        expiration_date: Joi.date(),
        cvv: Joi.number(),
        contribute_type: Joi.string().valid("marketing", "business", "personal").required()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            // let contribute = await Contribute.findOne({user_id : data.user_id , contribute_type:data.contribute_type});
            // if(contribute){
            //     contribute["card_name"] = data.card_name;
            //     contribute["card_number"] = data.card_number;
            //     contribute["amount"] = data.amount;
            //     contribute["expiration_date"] = data.expiration_date;
            //     contribute["cvv"] = data.cvv;
            //     contribute["contribute_type"] = data.contribute_type;
            //     contribute.save();
            //     return res.status(200).json(contribute);

            // }
            // else{

            let contribute = new Contribute(data);
            contribute.save((err, resp) => {
                if (!err) {
                    res.status(200).json(resp);
                }
                else {
                    res.status(400).json(err);
                }
            })
            // }
        }
    } catch (err) {
        console.log("err", err)
        res.status(400).json(err.message);
    }
})

router.get("/", middlewear.checkToken, async (req, res) => {
    try {
        let contribution = await Contribute.find().sort({ _id: -1 })
        res.status(200).json(contribution)
    } catch (err) {
        res.status(400).json(err)
    }
})


router.get("/:user_id",middlewear.checkToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        let contribute = await Contribute.find({ user_id: user_id });
        let marketing = contribute.filter(f => f.contribute_type == "marketing")[0];
        let business = contribute.filter(f => f.contribute_type == "business")[0];
        let personal = contribute.filter(f => f.contribute_type == "personal")[0];

        res.status(200).json({ marketing, business, personal })
    } catch (err) {
        res.status(400).json(err.message);
    }
})


router.delete("/:review_id", middlewear.checkToken, async (req, res) => {
    const { review_id } = req.params;
    try {
        let product = await Review.findByIdAndRemove(review_id);
        res.status(200).json(product);
    } catch (err) {
        res.status(400).json(err.message)
    }
});



module.exports = router;
