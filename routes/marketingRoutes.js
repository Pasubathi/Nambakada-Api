const express = require("express");
var router = express.Router();
const Joi = require('@hapi/joi');
const marketing = require('../model/marketing');
const Upload = require("../s3.js").uploadVideo;
const middlewear = require("../middleware");

router.post("/",
  middlewear.checkToken,
  Upload.array("images", 5),
  async (req, res) => {
    const data = req.body;
    console.log(data, "IMAGES MARKETING")
    const schema = Joi.object({
      images: Joi.array()
    })
    try {
      let value = await schema.validateAsync(data);
      if (!value.error) {
        let images = [];
        if (req.files) {
          let file = req.files;
          file.map((text) => {
            images = [...images, text.location];
          });
          data["images"] = images;
        } else {
          data["images"] = data.images;
        }

        const marketingImages = new marketing(data);

        marketingImages.save((error, success) => {
          if (!error) {
            return res.status(200).json({ data: success, message: "uploaded" });
          } else {
            return res.status(400).json({ data: error, message: "not uploaded" });
          }
        })
      } else throw value.error
    } catch (error) {
      return res.status(400).json({ hasError: true, message: "File Not Submitted", error: error })
    }
  });

router.get("/", async (req, res) => {
  try {
    const results = await marketing.find().sort({ _id: -1 });
    console.log(results, "RESULTS");
    let arr = [];
    results.map(result => {
      if (arr.length) {
        arr = [...arr, { ...result.images, _id: result._id }]
      } else {
        arr = [{ ...result.images, _id: result._id }]
      }
    })
    return res.status(200).json(arr);
  } catch (err) {
    return res.status(400).json(err);
  }
});

router.delete("/:imageId", middlewear.checkToken, async (req, res) => {
  const { imageId } = req.params;
  marketing.findByIdAndDelete(imageId, function (err, docs) {
    if (err) {
      console.log(err)
      return res.status(400).json(err)
    }
    else {
      console.log("Deleted : ", docs);
      res.status(200).json({ message: "Deleted Successfully", data: docs })
    }
  })
})

module.exports = router;

