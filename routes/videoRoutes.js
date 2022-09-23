const express = require("express");
const Video = require("../model/video");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require("@hapi/joi");
const Product = require("../model/product");
const crypto = require("crypto");
const Tag = require("../model/Tag");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const aws = require("aws-sdk");
const Upload = require("../s3.js").uploadVideo;
const DeleteVideo = require("../s3.js").deleteVideo;

const AmazonS3URI = require("amazon-s3-uri");

router.get("/my_video/:user_id", middlewear.checkToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    console.log("user_id", user_id);
    let video = await Video.find({ user_id: user_id, deleted: { $ne: true } })
      .sort({ _id: -1 })
      .populate({ path: "tags", select: "tag" });
    console.log("user_id", video);
    res.status(200).json(video);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.post("/", middlewear.checkToken, Upload.single("video"), async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    video: Joi.string(),
    user_id: Joi.string().required(),
    tags: Joi.array(),
    poster: Joi.string().required()
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      let images = [];
      let tag_id = [];
      if (req.file) {
        let file = req.file;
        data["video"] = req.file.location;
      } else {
        data["video"] = data.video;
      }
      let tags = data.tags;
      // data.tags = []
      console.log("data", data);
      let video = new Video(data);
      let title_tag = new Tag({
        object_id: video._id,
        tag_type: "video",
        tag: data.title,
      });
      title_tag.save();
      console.log("title_tag", title_tag);
      tag_id = [...tag_id, title_tag._id];
      // if(tags&& tags.length> 0){
      for (let i = 0; i < tags.length; i++) {
        let tag = new Tag({
          object_id: video._id,
          tag_type: "video",
          tag: tags[i],
        });
        tag.save();
        console.log(tag);
        tag_id = [...tag_id, tag._id];
      }
      console.log("final", tag_id);

      video["tags"] = tag_id;
      console.log("tag_id", video);
      video.save((err, prod) => {
        if (!err) {
          console.log("start", prod);
          res.status(200).json(prod);
        } else {
          console.log("err", err);
          res.status(400).json(err);
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
});

router.put(
  "/:video_id",
  middlewear.checkToken,
  Upload.single("video"),
  async (req, res) => {
    const data = req.body;
    const { video_id } = req.params;
    const schema = Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      video: Joi.string(),
      user_id: Joi.string(),
      tags: Joi.array(),
    });
    try {
      let value = await schema.validateAsync(data);
      if (!value.error) {
        if (req.file) {
          data["video"] = req.file.location;
        } else {
          data["video"] = data.video;
        }
        let video = await Video.findByIdAndUpdate(
          video_id,
          {
            $set: data,
          },
          { new: true }
        );
        res.status(200).json(video);
      }
    } catch (err) {
      res.status(400).json(err.message);
    }
  }
);

router.put("/like/:video_id", middlewear.checkToken, async (req, res) => {
  const { video_id } = req.params;
  try {
    let data = {};
    let foundVideo = await Video.findById(video_id);

    const found = foundVideo.likes.includes(req.body.likes[0]);
    if (found) {
      const index = foundVideo.likes.indexOf(req.body.likes[0]);
      foundVideo.likes.splice(index, 1);
    } else {
      foundVideo.likes.push(req.body.likes[0]);
    }

    data["likes"] = foundVideo.likes;

    let video = await Video.findByIdAndUpdate(
      video_id,
      { $set: data },
      { new: true }
    );

    res.status(200).json(video.likes);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/play/:video_id/:user_id", async (req, res) => {
  const { video_id, user_id } = req.params;
  try {
    let video = await Video.findById(video_id);

    // console.log({video})
    if (!video.views.includes(user_id)) {
      video["views"] = [...video.views, user_id];
    }
    let videoSave = await Video.findByIdAndUpdate(
      video_id,
      {
        $set: { views: video.views },
      },
      { new: true }
    );

    res.status(200).json(videoSave);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/", async (req, res) => {
  const { tag } = req.query;
  let page = 1;
  req.query.page ? (page = req.query.page) : null;
  const per_page = 10;
  try {
    console.log("tag", tag);
    if (tag && tag.length > 0) {
      let id = [];
      let pattern = new RegExp(`/^${tag}/i`, "g")
      let tag_data = await Tag.find({
        tag: { $regex: `^${tag}$`, $options: 'i' },
        tag_type: "video",
      });
      console.log(tag_data, "RESPONSE")
      tag_data.map((text) => {
        id = [...id, text.object_id];
      });
      let video = await Video.find({ _id: { $in: id }, deleted: { $ne: true } })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        })
        .sort({ _id: -1 });

      res.status(200).json(video);
    } else {
      let video = await Video.find({ deleted: { $ne: true } })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        })
        .sort({ _id: -1 });
      res.status(200).json(video);
    }
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/:video_id", async (req, res) => {
  const { video_id } = req.params;
  try {
    let data = await Video.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(video_id) },
      },
      {
        $match: { deleted: { $ne: true } },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "video_id",
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviews.user_id",
          foreignField: "_id",
          as: "review_user",
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/admin/:video_id", middlewear.checkToken, async (req, res) => {
  const { video_id } = req.params;
  try {
    let data = await Video.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(video_id) },
      },

      {
        $lookup: {
          from: "flags",
          localField: "_id",
          foreignField: "video_id",
          as: "flag",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "flag.user_id",
          foreignField: "_id",
          as: "flag_user",
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.delete("/:video_id", middlewear.checkToken, async (req, res) => {
  const { video_id } = req.params;
  console.log("video_id", video_id);
  try {
    let video = await Video.findByIdAndUpdate(
      video_id,
      {
        $set: { deleted: true },
      },
      { new: true }
    );
    console.log("path", video.video);

    DeleteVideo(video.video);
    res.status(200).json(video);
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
});

router.delete("/", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  let email = req.decoded._id;
  try {
    const schema = Joi.object({
      ids: Joi.array().required(),
    });

    const value = await schema.validateAsync(data);
    if (!value.error) {
      if (email != config.hopeup_admin) {
        return res
          .status(200)
          .json({ error: true, message: "You can not perform this operation" });
      }

      let ids = data.ids;
      let obj = [];
      console.log("ids", data);
      for (let i = 0; i < ids.length; i++) {
        let user = await Video.findByIdAndUpdate(
          ids[i],
          { $set: { deleted: true } },
          { new: true }
        );
        obj = [...obj, user];
      }

      res.status(200).json({
        error: true,
        message: "Successfully deleted",
        deletedItems: obj,
      });
    }
  } catch (err) {
    console.log(err);

    res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

module.exports = router;
