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
const multerS3 = require('multer-s3');
const fs = require("fs")
const AWS = require("aws-sdk");
const multer = require('multer');
const AmazonS3URI = require('amazon-s3-uri')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/image');
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    },

});



AWS.config.update({
    secretAccessKey: 'CtI87dV/MpnszebpodZ9cyHGqW8HoyfXxsUToHZV',
    accessKeyId: 'AKIAILMWNZCQECKSEGFQ',
  });
// const upload = multer({ storage: storage });



const s3 = new AWS.S3();
const awsStorage = multerS3({
  s3: s3,
  bucket:'hopeupassets',
  key: function(req, file, cb) {
    console.log(file);
    cb(null, file.originalname);
  },
  acl: 'public-read-write',
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

const upload = multer({
    storage: awsStorage,
    /** in above line if you are using local storage in ./public/uploads folder than use
     ******* storage: fileStorage,
     * if you are using aws s3 bucket storage than use
     ******* storage: awsStorage(),
     */
    // limits: { fileSize: 5000000 },
    // fileFilter: function(req, file, cb) {
    //   checkFileType(file, cb);
    // }
  });

router.post('/uploadImage' ,upload.array('images' , 10) ,  async(req , res)=>{
    console.log('image' , req.files , req.body);
    let path  = []
    req.files.map(f=>{
        path = [...path  , f.location]
    })
    res.set('Content-Type', 'application/json');      
    res.status(200).json(path).end();
  })
        
    
router.delete("/" ,async(req , res)=>{
  // console.log(`https://hopeupassets.s3.us-east-2.amazonaws.com/${req.params.key}`);
  const uri = 'https://hopeupassets.s3.us-east-2.amazonaws.com/Screencast+from+25-09-2020+15%3A21%3A20.webm'
        const { region, bucket, key } = AmazonS3URI(uri);
        console.log({key , bucket , region});
  // s3.deleteObject({
  //   Bucket: "hopeupassets",
  //   Key: req.params.key
  // },function (err,data){
  //     console.log("data" , data , err)
  // })

});

     // let path = [] 
    // let array = req.files;
    // for (let i = 0; i < array.length; i++) {
    //     fs.readFile(array[i].path, async (err, data)=> {
    //         if (err) throw err; // Something went wrong!
    //         var s3bucket = new AWS.S3({params: {Bucket: 'hoprup'}});
    //         // s3bucket.createBucket(function () {
    //             var params = {
    //                 Key: array[i].filename, //file.name doesn't exist as a property
    //                 Body: data,
    //                 acl: 'public-read-write',
    //                 contentType: multerS3.AUTO_CONTENT_TYPE,

    //             };
    //             let up =await s3bucket.upload(params);
    //                 // Whether there is an error or not, delete the temp file
    //                 // fs.unlink(array[i].path, function (err) {
    //                 //     if (err) {
    //                 //         console.error(err);
    //                 //     }
    //                 //     console.log('Temp File Delete');
    //                 // });
    
    //                 console.log("PRINT FILE:" , up);
    //                 if(up && up.Location){
    //                     path =  [...path  , up];
    //                 }
                        
                        
                    
                
    //         });
        
        
    // }

    
   


// var file = req.files.file;
//     fs.readFile(file.path, function (err, data) {
//         if (err) throw err; // Something went wrong!
//         var s3bucket = new AWS.S3({params: {Bucket: 'mybucketname'}});
//         s3bucket.createBucket(function () {
//             var params = {
//                 Key: file.originalFilename, //file.name doesn't exist as a property
//                 Body: data
//             };
//             s3bucket.upload(params, function (err, data) {
//                 // Whether there is an error or not, delete the temp file
//                 fs.unlink(file.path, function (err) {
//                     if (err) {
//                         console.error(err);
//                     }
//                     console.log('Temp File Delete');
//                 });

//                 console.log("PRINT FILE:", file);
//                 if (err) {
//                     console.log('ERROR MSG: ', err);
//                     res.status(500).send(err);
//                 } else {
//                     console.log('Successfully uploaded data');
//                     res.status(200).end();
//                 }
//             });
//         });
//     });
// };

module.exports = router;
