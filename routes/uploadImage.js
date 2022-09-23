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
const Tag = require('../model/Tag');
const multer = require("multer");
const multerS3 = require('multer-s3');
const fs = require("fs")
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo


router.post('/' ,Upload.array('images' , 10) , async(req ,res )=>{
    const data =  req.body
    const schema = Joi.object({
        images : Joi.array(),
    
    })
    try{ 
        let value =  schema.validateAsync(data);
        console.log('data' , data , req.file);
        let real_data = []
        if(!value.error && req.files){
            req.files.map(m=>{
                console.log('filees' , m.location);
                real_data = [...real_data , m.location];
            })
            res.status(200).json(real_data);
        }
    }catch(err){
        console.log('err' , err);
        res.status(400).json(err)
    }

    
})
    

module.exports = router;
