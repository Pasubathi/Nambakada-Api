const express = require("express");
const User = require("../model/user");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const Joi = require('@hapi/joi');
const Product = require("../model/product");
const Cart = require('../model/cart');
const Upload = require("../s3.js").uploadVideo

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        product_id: Joi.string().required(),
        quantity: Joi.number().required()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let obj;
            let check_product = await Cart.findOne({ user_id: data.user_id, product_id: data.product_id })
            if (check_product) {
                // let quan = data.quantity + check_product.quantity;
                // obj = {
                //     quantity: quan,
                //     total: quan * check_product.price
                // };
                // let update_cart = await Cart.findOneAndUpdate({ user_id: data.user_id, product_id: data.product_id }, {
                //     $set: obj
                // }, { new: true }
                // );
                return res.status(201).json({data: check_product, message: "You  have already added "});
            } else {
                let product = await Product.findById(data.product_id);
                obj = {
                    name: product.title,
                    image: product.images[0],
                    quantity: data.quantity,
                    price: product.price,
                    total: product.price * data.quantity,
                    user_id: data.user_id,
                    product_id: product._id,
                    seller_id: product.user_id
                }
                let cart = new Cart(obj);
                cart.save();
                res.status(200).json(cart);
            }
        }
    } catch (err) {
        console.log('err', err)
        res.status(400).json(err.message);
    }
})


router.put("/:cart_id", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const { cart_id } = req.params;
    const schema = Joi.object({
        quantity: Joi.number()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            if (data.quantity == 0) {
                let cart = await Cart.findByIdAndRemove(cart_id);
                return res.status(200).json(cart);
            }
            let cart = await Cart.findById(cart_id);
            cart["quantity"] = data.quantity;
            cart["total"] = cart.price * data.quantity;
            cart.save();

            res.status(200).json(cart);
        }
    } catch (err) {
        res.status(400).json(err.message);
    }
})


router.get("/:user_id", middlewear.checkToken, async (req, res) => {
    const { user_id } = req.params;
    try {

        let cart = await Cart.find({ user_id: user_id }).sort({ _id: -1 }).populate("product_id");
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json(err.message)
    }
});



router.delete("/:cart_id", middlewear.checkToken, async (req, res) => {
    const { cart_id } = req.params;
    try {
        let cart = await Cart.findByIdAndRemove(cart_id);
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json(err.message)
    }
});


module.exports = router;
