const fs = require("fs")
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require('multer-s3');
const AmazonS3URI = require('amazon-s3-uri')


aws.config.update({
    secretAccessKey: 'CtI87dV/MpnszebpodZ9cyHGqW8HoyfXxsUToHZV',
    accessKeyId: 'AKIAILMWNZCQECKSEGFQ',
  });

var s3 = new aws.S3();


var uploadVideo = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'hopeupassets',
    acl: 'public-read-write',
    contentType: multerS3.AUTO_CONTENT_TYPE,
   
    key: function (req, file, cb) {
      console.log("key" , file)
      cb(null, Date.now() + file.originalname); //use Date.now() for unique file keys
    }
  })
});

const deleteVideo = (url)=>{
  console.log("url" , url);
  const { region, bucket, key } = AmazonS3URI(url);
  s3.deleteObject({
      Bucket: "hopeupassets",
      Key: key
    },function (err,data){
        console.log("data" , data , err)
    })

}

module.exports = {uploadVideo ,deleteVideo }


