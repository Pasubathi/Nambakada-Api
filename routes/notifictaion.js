const express = require("express");
const Flag = require("../model/flag");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const Product = require("../model/product");
const Video = require("../model/video");
const Adv = require("../model/adv");
const Notification = require('../index')
const crypto = require('crypto');
const Tag = require('../model/Tag');
const multer = require("multer");
const multerS3 = require('multer-s3');
const fs = require("fs")
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo
const Not = require('../model/notification')

// router.put("/:fav_id" ,middlewear.checkToken ,  Upload.array("images" , 5) , async(req , res)=>{
//     const data = req.body;
//     const {fav_id} = req.params;
//     const schema = Joi.object({
//         user_id : Joi.string(),
//         product_id : Joi.string(),
//         video_id : Joi.string(),
//         adv_id : Joi.string(),
//         favourite_type : Joi.string()
//     })
//     try{
//         let value = await schema.validateAsync(data);
//         if(!value.error){
           
//             let fav = await Favourite.findByIdAndUpdate(fav_id , {
//                 $set : data
//             } , {new : true});
//             res.status(200).json(fav);
//         }
//     }catch(err){
//         res.status(400).json(err.message);
//     }
// })


// router.get("/my_fav/:user_id"  , async(req , res)=>{
//     const {user_id} = req.params;
//     try{
//         let product =[];
//         let video = [];
//         let adv = []
//         let fav = await Favourite.find({user_id : user_id}).populate("product_id video_id , adv_id");
//         for (let index = 0; index < fav.length; index++) {
//            if(fav[index] && fav[index].product_id){
//             product = [...product , fav[index]];
//            }
//            else if(fav[index] && fav[index].video_id){
//                video = [...video , fav[index]];
//            }else{
//                adv = [...adv , fav[index]]
//            }
            
//         }
//         res.status(200).json({product , video , adv});
//     }catch(err){
//         res.status(400).json(err.message)
//     }
// });

router.get("/:user_id" , async(req , res)=>{
    const {user_id} = req.params;
    try{
        let notification = await Not.aggregate([
            {
                $match : {notification_id : mongoose.Types.ObjectId(user_id)}
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup:
                {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $lookup:
                {
                    from: 'videos',
                    localField: 'video_id',
                    foreignField: '_id',
                    as: 'video'
                }
            },
            {
                $lookup:
                {
                    from: 'advs',
                    localField: 'adv_id',
                    foreignField: '_id',
                    as: 'advertise'
                }
            }


        ])
        res.status(200).json(notification);
    }catch(err){
        res.status(400).json(err.message)
    }
});



router.get("/" , async(req , res)=>{
    try{
        
        let not = await Not.find();
        res.status(200).json(not);
        
    }catch(err){
        res.status(400).json(err.message)
    }
});



// router.delete("/:fav_id" ,middlewear.checkToken ,  async(req , res)=>{
//     const {fav_id} =  req.params;
//     try{
//         let fav = await Favourite.findByIdAndRemove(fav_id);
//         res.status(200).json(fav);
//     }catch(err){
//         res.status(400).json(err.message);
//     }
// });


module.exports = router;
