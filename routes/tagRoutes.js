const express = require("express");
const Video = require("../model/video");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const Product = require("../model/product");
const crypto = require('crypto');
const Tag = require('../model/Tag');
const Adv = require("../model/adv");
const multerS3 = require('multer-s3');
const fs = require("fs")
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo

router.post("/" , middlewear.checkToken, async(req , res)=>{
    const data = req.body;
    const schema = Joi.object({
        tag : Joi.string().required(),
        object_id : Joi.string().required(),
        tag_type : Joi.string().required()
    })
    try{
        let value = await schema.validateAsync(data);
        if(!value.error){
            let tag = new Tag(data);
            tag.save()
            if(tag.tag_type == "product"){
                let product = await Product.findById(tag.object_id);
                product.tags = [tag._id , ...product.tags];
                product.save();
                return res.status(200).json(tag);
            }else if(tag.tag_type == "video"){
                let video = await Video.findById(tag.object_id);
                video.tags = [tag._id , ...video.tags];
                video.save();
                return res.status(200).json(tag);
                
            }else{
                let adv = await Adv.findById(tag.object_id);
                adv.tags = [tag._id , ...adv.tags];
                adv.save();
                return res.status(200).json(tag);
            }
        }
    }catch(err){
        console.log(err)
        res.status(400).json(err.message);
    }
})


router.get("/" , async(req  , res)=>{
    try{
        let tag = await Tag.find();
        res.status(200).json(tag);
    }catch(err){
        
    }
})

// router.put("/:selling_id"  , async(req , res)=>{
//     const data = req.body;
//     const {selling_id} = req.params;
//     const schema = Joi.object({
//         routing_number : Joi.string().required(),
//         account_number :Joi.string().required(),
//         bank_name:Joi.string().required(),
//         user_id : Joi.string().required(),
//     })
//     try{
//         let value = await schema.validateAsync(data);
//         if(!value.error){
            
//             let selling = await Selling.findByIdAndUpdate(selling_id , {
//                 $set : data
//             } , {new : true});
//             res.status(200).json(selling);
//         }
//     }catch(err){
//         res.status(400).json(err.message);
//     }
// })


router.get("/:tag_id" , async(req , res)=>{
    const {tag_id} = req.params;
    try{
        let selling = await Tag.find({object_id : tag_id});
        res.status(200).json(selling);
    }catch(err){
        res.status(400).json(err.message)
    }
});

router.delete('/:tag_id' , middlewear.checkToken, async(req ,res)=>{
    const data = req.params;
    const schema = Joi.object({
        tag_id : Joi.string().required(),
        // tag_id : Joi.string().required(),
        // tag_type:Joi.string()
    })
    try{
        let value = await schema.validateAsync(data);
        if(!value.error){
            let tag = await Tag.findById(data.tag_id);
            
            if(tag.tag_type == "product"){
                let product = await Product.findById(tag.object_id);
                product.tags = product.tags.filter(f=> f != data.tag_id );
                product.save();
                return res.status(200).json(product)  
            }else if(tag.tag_type == "video"){
                let video = await Video.findById(tag.object_id);
                video.tags = video.tags.filter(f=> f != data.tag_id );
                video.save();
                return res.status(200).json(video)  
            }else{
                let adv = await Adv.findById(tag.object_id);
                adv.tags = adv.tags.filter(f=> f != data.tag_id );
                adv.save();
                return res.status(200).json(adv)  
            }
        } 
    }catch(err){
        console.log(err);
        res.status(400).json(err)
    }
})

module.exports = router;
