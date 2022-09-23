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
const Review = require('../model/review');
const Video = require('../model/video')
const Notification = require('../index');
const adv = require("../model/adv");
const review = require("../model/review");

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        product_id: Joi.string(),
        video_id: Joi.string(),
        adv_id: Joi.string(),
        review: Joi.string(),
        rating: Joi.number(),
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let review = new Review(data);
            let action = ""
            let not, obj;
            if (data && data.product_id) {
                action = 'product'
                not = await Product.findById(data.product_id);
                obj = {
                    user_id: data.user_id,
                    title: "commented",
                    notification_type: action,
                    product_id: data.product_id,
                    notification_id: not.user_id
                }
            } else if (data && data.video_id) {

                action = 'video'
                not = await Video.findById(data.video_id);
                obj = {
                    user_id: data.user_id,
                    title: "commented",
                    notification_type: action,
                    video_id: data.video_id,
                    notification_id: not.user_id
                }
            } else if (data && data.adv_id) {
                not = await adv.findById(data.adv_id)
                action = 'advertise';
                obj = {
                    user_id: data.user_id,
                    title: "commented",
                    notification_type: action,
                    adv_id: data.adv_id,
                    notification_id: not.user_id
                }
            }
            console.log('action', action);


            Notification.not(obj)
            review["review_type"] = action;
            review.save((err, resp) => {
                if (!err) {
                    res.status(200).json(resp);

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


router.put("/:review_id", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const { review_id } = req.params;
    const schema = Joi.object({
        review: Joi.string(),
        rating: Joi.number(),

    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let product = await Review.findByIdAndUpdate(review_id, {
                $set: data
            }, { new: true });
            res.status(200).json(product);
        }
    } catch (err) {
        res.status(400).json(err.message);
    }
})



router.delete('/', middlewear.checkToken, async (req, res) => {
    const data = req.body;
    let email = req.decoded._id;
    try {
        console.log("check", data)
        const schema = Joi.object({
            ids: Joi.array().required(),
        });

        const value = await schema.validateAsync(data);
        if (!value.error) {
            if (email != config.hopeup_admin) {
                return res.status(200).json({ error: true, message: "You can not perform this operation" })
            }

            let ids = data.ids;
            let obj = []
            console.log("ids", data)
            for (let i = 0; i < ids.length; i++) {
                let user = await Review.findByIdAndRemove(ids[i]);
                obj = [...obj, user]
            }

            res.status(200).json({ error: true, message: "Successfully deleted", deletedItems: obj })
        }
    } catch (err) {
        console.log(err)

        res.status(400).json({
            error: true,
            message: err.message

        })
    }

});


router.get("/", async (req, res) => {
    try {
        let page = 1;
        req.query.page ? page = req.query.page : null;
        let per_page = 50;
        if (req.query.review_type) {
            let product = req.query.tag ? await Review.find({ review_type: req.query.review_type, review: { $regex: req.query.tag } }).skip(per_page * page - per_page).limit(per_page).populate({ path: 'user_id', select: 'username , first_name , last_name , profile_picture' }).sort({ _id: -1 }) :
                await Review.find({ review_type: req.query.review_type }).skip(per_page * page - per_page).limit(per_page).populate({ path: 'user_id', select: 'username , first_name , last_name , profile_picture' }).sort({ _id: -1 });
            res.status(200).json(product);
        }
    } catch (err) {
        res.status(400).json(err.message)
    }
});



module.exports = router;
