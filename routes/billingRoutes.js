const express = require("express");
const User = require("../model/user");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const Billing = require("../model/billing");
const crypto = require('crypto');
const Review = require('../model/review')

router.post("/" ,middlewear.checkToken ,  async(req , res)=>{
    const data = req.body;
    const schema = Joi.object({
        user_id : Joi.string().required(),
        first_name: Joi.string().required(),
        last_name:Joi.string().required(),
        email : Joi.string().required(),
        address :Joi.string().required(),
        city : Joi.string().required(),
        state : Joi.string().required(),
        postal_code : Joi.number().required(),
        country : Joi.string().required(),
        order_ids : Joi.array().required()
        
    })    
    try{
        let value = await schema.validateAsync(data);
        if(!value.error){
            let billing = new Billing(data);
             billing.save((err , resp)=>{
                if(!err){
                    
                    res.status(200).json(resp);
                    
                }
                else{
                    res.status(400).json(err);
                }
            })
        }
    }catch(err){
        res.status(400).json(err.message);
    }
})


// router.put("/:b" ,middlewear.checkToken ,  async(req , res)=>{
//     const data = req.body;
//     const {review_id} = req.params;
//     const schema = Joi.object({
//         review : Joi.string(),
//         rating: Joi.number(),
        
//     })
//     try{
//         let value = await schema.validateAsync(data);
//         if(!value.error){
//             let product = await Review.findByIdAndUpdate(review_id , {
//                 $set : data
//             } , {new : true});
//             res.status(200).json(product);
//         }
//     }catch(err){
//         res.status(400).json(err.message);
//     }
// })



// router.delete("/:review_id" ,middlewear.checkToken ,  async(req , res)=>{
//     const {review_id} =  req.params;
//     try{
//         let product = await Review.findByIdAndRemove(review_id);
//         res.status(200).json(product);
//     }catch(err){
//         res.status(400).json(err.message)
//     }
// });

router.get("/" , middlewear.checkToken, async(req , res)=>{
    try{
        let product = await Billing.find();
        res.status(200).json(product);
    }catch(err){
        res.status(400).json(err.message)
    }
});



module.exports = router;
