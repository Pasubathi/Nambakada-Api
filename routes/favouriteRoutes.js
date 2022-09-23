const express = require("express");
const Favourite = require("../model/favourite");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require("@hapi/joi");
const Product = require("../model/product");
const Video = require("../model/video");
const Adv = require("../model/adv");

const crypto = require("crypto");
const Tag = require("../model/Tag");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo;
const Notification = require("../index");

router.post("/", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    user_id: Joi.string().required(),
    product_id: Joi.string(),
    video_id: Joi.string(),
    adv_id: Joi.string(),
    favourite_type: Joi.string()
      .valid("product", "video", "advertise")
      .required(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      let obj = {};
      let item = {};
      if (data.favourite_type === "product") {
        obj = {
          user_id: data.user_id,
          product_id: data.product_id,
          favourite_type: data.favourite_type,
        };

        let product = await Product.findById(data.product_id);

        item = {
          user_id: data.user_id,
          title: "liked",
          notification_type: data.favourite_type,
          product_id: data.product_id,
          notification_id: product.user_id,
        };
      } else if (data.favourite_type === "video") {
        obj = {
          user_id: data.user_id,
          video_id: data.video_id,
          favourite_type: data.favourite_type,
        };

        let video = await Video.findById(data.video_id);

        item = {
          user_id: data.user_id,
          title: "liked",
          notification_type: data.favourite_type,
          video_id: data.video_id,
          notification_id: video.user_id,
        };
      } else {
        obj = {
          user_id: data.user_id,
          adv_id: data.adv_id,
          favourite_type: data.favourite_type,
        };
        let adv = await Adv.findById(data.adv_id);
        item = {
          user_id: data.user_id,
          title: "liked",
          notification_type: data.favourite_type,
          adv_id: data.adv_id,
          notification_id: adv.user_id,
        };
      }
      let check = await Favourite.find(obj);
      if (check && check.length > 0) {
        await Favourite.findByIdAndRemove(check[0]._id);
        res.status(200).json({
          error: false,
          message: "Item has been removed from your favourite list",
        });
      } else {
        let fav = new Favourite(data);
        fav.save();
        Notification.not(item);
        res.status(200).json({
          error: false,
          message: "Item has been added to your favourite list",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
});

router.put(
  "/:fav_id",
  middlewear.checkToken,
  Upload.array("images", 5),
  async (req, res) => {
    const data = req.body;
    const { fav_id } = req.params;
    const schema = Joi.object({
      user_id: Joi.string(),
      product_id: Joi.string(),
      video_id: Joi.string(),
      adv_id: Joi.string(),
      favourite_type: Joi.string(),
    });
    try {
      let value = await schema.validateAsync(data);
      if (!value.error) {
        let fav = await Favourite.findByIdAndUpdate(
          fav_id,
          {
            $set: data,
          },
          { new: true }
        );
        res.status(200).json(fav);
      }
    } catch (err) {
      res.status(400).json(err.message);
    }
  }
);

router.get("/my_fav/:user_id", middlewear.checkToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    let product = [];
    let video = [];
    let adv = [];
    let fav = await Favourite.find({ user_id: user_id })
      .sort({ _id: -1 })
      .populate("product_id , video_id , adv_id , user_id");
    console.log("all", fav);
    for (let index = 0; index < fav.length; index++) {
      if (fav[index] && fav[index].product_id) {
        product = [...product, fav[index]];
      } else if (fav[index] && fav[index].video_id) {
        video = [...video, fav[index]];
      } else if (fav[index] && fav[index].adv_id) {
        adv = [...adv, fav[index]];
      }
    }
    console.log({ video });
    res.status(200).json({ product, video, adv });
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/:fav_id", async (req, res) => {
  const { fav_id } = req.params;
  try {
    let fav = await Favourite.findById(fav_id).populate(
      "product_id video_id , adv_id"
    );
    res.status(200).json(fav);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/", async (req, res) => {
  try {
    let fav = await Favourite.find();
    res.status(200).json(fav);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.delete("/:fav_id", middlewear.checkToken, async (req, res) => {
  const { fav_id } = req.params;
  try {
    let fav = await Favourite.findByIdAndRemove(fav_id);
    res.status(200).json(fav);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

module.exports = router;
