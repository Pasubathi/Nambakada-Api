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

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        product_id: Joi.string(),
        video_id: Joi.string(),
        adv_id: Joi.string(),
        flag_type: Joi.string().valid("product", "video", "advertise").required(),
        category: Joi.number().min(1).max(4).required()

    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let item = {}
            let obj = {}
            if (data.flag_type == "product") {
                obj = {
                    user_id: data.user_id,
                    product_id: data.product_id,
                    flag_type: data.flag_type
                }
                let not = await Product.findById(data.product_id)
                item = {
                    user_id: data.user_id,
                    title: "flaged",
                    notification_type: 'product',
                    product_id: data.product_id,
                    notification_id: not.user_id
                }
            } else if (data.flag_type == "video") {
                obj = {
                    user_id: data.user_id,
                    video_id: data.video_id,
                    flag_type: data.flag_type
                }
                let not = await Video.findById(data.video_id)
                item = {
                    user_id: data.user_id,
                    title: "flaged",
                    notification_type: 'video',
                    video_id: data.video_id,
                    notification_id: not.user_id
                }
            } else {
                obj = {
                    user_id: data.user_id,
                    adv_id: data.adv_id,
                    flag_type: data.flag_type
                }
                let not = await Adv.findById(data.adv_id)
                item = {
                    user_id: data.user_id,
                    title: "flaged",
                    notification_type: 'advertise',
                    adv_id: data.adv_id,
                    notification_id: not.user_id
                }
            }
            console.log('obj', obj)
            let check = await Flag.find(obj);
            console.log('check', check)
            if (check && check.length > 0) {

                res.status(200).json({ error: false, message: 'You already flag this item' });
            } else {
                let fav = new Flag(data);

                Notification.not(item)

                fav.save();
                res.status(200).json({ error: false, message: 'This item has been flagged' });
            }

        }
    } catch (err) {
        console.log(err)
        res.status(400).json(err.message);
    }
})


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

// router.get("/:fav_id" , async(req , res)=>{
//     const {fav_id} = req.params;
//     try{
//         let fav = await Favourite.findById(fav_id).populate("product_id video_id , adv_id");
//         res.status(200).json(fav);
//     }catch(err){
//         res.status(400).json(err.message)
//     }
// });



router.get("/", async (req, res) => {
    try {
        let ids = [];
        let obj = {}
        console.log("query", req.query)
        if (req.query.flag_type == "product" && req.query.title) {
            console.log("product")
            let product = await Product.find({ title: { $regex: req.query.title } });

            product.map(m => {
                ids = [...ids, m._id]
            })
            obj = {
                flag_type: req.query.flag_type,
                "product_id": { $in: ids }

            }
        } else if (req.query.flag_type == "video" && req.query.title) {
            let product = await Video.find({ title: { $regex: req.query.title } });
            product.map(m => {
                ids = [...ids, m._id]
            })
            obj = {
                flag_type: req.query.flag_type,
                "video_id": { $in: ids }

            }
        } else if (req.query.flag_type == "advertise" && req.query.title) {
            let product = await Adv.find({ title: { $regex: req.query.title } });
            product.map(m => {
                ids = [...ids, m._id]
            })
            obj = {
                flag_type: req.query.flag_type,
                "adv_id": { $in: ids }

            }
        }
        console.log("ids", ids)
        if (req.query.flag_type && req.query.title) {

            let fav = await Flag.find(obj).populate("product_id").populate("video_id").populate("adv_id").populate("user_id");
            console.log("fav", fav)
            res.status(200).json(fav);

        } else if (req.query.flag_type) {
            let fav = await Flag.find({ flag_type: req.query.flag_type }).sort({_id : -1}).populate("product_id").populate("video_id").populate("adv_id").populate("user_id");
            let uniqueFav;
            if(req.query.flag_type == "product"){
                uniqueFav = Array.from(new Set(fav.map(a => a.product_id._id)))
                .map(id => {
                    let to = fav.find(a => a.product_id._id === id)
                    console.log("to", to)
                    return to;
                })
            console.log("fav", fav)

            }else if(req.query.flag_type == "video"){
                uniqueFav = Array.from(new Set(fav.map(a => a.video_id._id)))
                .map(id => {
                    let to = fav.find(a => a.video_id._id === id)
                    console.log("to", to)
                    return to;
                })
            console.log("fav", fav)
            }else if(req.query.flag_type == "advertise"){
                uniqueFav = Array.from(new Set(fav.map(a => a.adv_id._id)))
                .map(id => {
                    let to = fav.find(a => a.adv_id._id === id)
                    console.log("to", to)
                    return to;
                })
            }
            

            res.status(200).json(uniqueFav);

        }

    } catch (err) {
        console.log(err)
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
                let user = await Flag.findByIdAndRemove(ids[i]);
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


module.exports = router;
