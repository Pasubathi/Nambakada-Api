const express = require("express");
const Adv = require("../model/adv");
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

router.get("/classified", middlewear.checkToken, async (req, res) => {
  const data = req.query;
  const schema = Joi.object({
    state: Joi.string().required(),
    city: Joi.string().required(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    tag: Joi.string(),
  });
  try {
    console.log("check", data);
    if (data.tag) {
      let id = [];
      let tag_data = await Tag.find({
        tag: { $regex: `^${data.tag}$`, $options: 'i' },
        tag_type: "adv",
      });
      tag_data.map((text) => {
        id = [...id, text.object_id];
      });
      let product = await Adv.find({
        state: data.state,
        city: data.city,
        category: data.category,
        sub_category: data.sub_category,
        _id: { $in: id },
        expired: false,
      })
        .sort({ _id: -1 })
        .populate("user_id");
      console.log("persian", product);
      return res.status(200).json(product);
    } else {
      let classified = await Adv.find({
        state: data.state,
        city: data.city,
        category: data.category,
        sub_category: data.sub_category,
        expired: false,
      })
        .sort({ _id: -1 })
        .populate("user_id");
      console.log(classified, "classfied");
      return res.status(200).json(classified);
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(err);
  }
});

router.post("/", middlewear.checkToken, Upload.array("images", 5), async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    images: Joi.array(),
    user_id: Joi.string().required(),
    tags: Joi.array(),
    city: Joi.string().required().lowercase(),
    state: Joi.string().required().lowercase(),
    price: Joi.number(),
    category: Joi.string().required().lowercase(),
    sub_category: Joi.string().required().lowercase(),
    path: Joi.string(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      if (req.files) {
        let file = req.files;
        let images = [];
        file.map((text) => {
          images = [...images, text.location];
        });
        data["images"] = images;
      } else {
        data["images"] = data.images;
      }
      let adv = new Adv(data);
      let tag_id = [];
      let title_tag = new Tag({
        object_id: adv._id,
        tag_type: "adv",
        tag: data.title,
      });
      title_tag.save();
      tag_id = [...tag_id, title_tag._id];
      if (data.tags && data.tags.length > 0) {
        data.tags.map((text) => {
          let tag = new Tag({ object_id: adv._id, tag_type: "adv", tag: text });
          tag.save();
          tag_id = [...tag_id, tag._id];
        });
      }
      adv["tags"] = tag_id;
      adv.save();
      res.status(200).json({ adv_id: adv.id });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json(error.message);
  }
});

router.put("/like/:adv_id", middlewear.checkToken, async (req, res) => {
  const { adv_id } = req.params;
  try {
    let data = {};
    let foundAdv = await Adv.findById(adv_id);

    const found = foundAdv.likes.includes(req.body.likes[0]);
    if (found) {
      const index = foundAdv.likes.indexOf(req.body.likes[0]);
      foundAdv.likes.splice(index, 1);
    } else {
      foundAdv.likes.push(req.body.likes[0]);
    }

    data["likes"] = foundAdv.likes;

    let adv = await Adv.findByIdAndUpdate(
      adv_id,
      { $set: data },
      { new: true }
    );

    res.status(200).json(adv.likes);
  } catch (error) {
    res.status(400).json(error);
  }
});

// router.post("/", Upload.array("images", 5), async (req, res) => {
//   const data = req.body;
//   const schema = Joi.object({
//     title: Joi.string().required(),
//     description: Joi.string(),
//     images: Joi.array(),
//     user_id: Joi.string().required(),
//     tags: Joi.array(),
//     city: Joi.string().required().lowercase(),
//     state: Joi.string().required().lowercase(),
//     price: Joi.number(),
//     category: Joi.string().required().lowercase(),
//     sub_category: Joi.string().required().lowercase(),
//     path: Joi.string(),
//   });
//   try {
//     let value = await schema.validateAsync(data);
//     if (!value.error) {
//       if (req.files) {
//         let file = req.files;
//         let images = [];
//         file.map((text) => {
//           images = [...images, text.location];
//         });
//         data["images"] = images;
//       } else {
//         data["images"] = data.images;
//       }
//       let adv = new Adv(data);
//       let tag_id = [];
//       let title_tag = new Tag({
//         object_id: adv._id,
//         tag_type: "adv",
//         tag: data.title,
//       });
//       title_tag.save();
//       tag_id = [...tag_id, title_tag._id];
//       if (data.tags && data.tags.length > 0) {
//         data.tags.map((text) => {
//           let tag = new Tag({ object_id: adv._id, tag_type: "adv", tag: text });
//           tag.save();
//           tag_id = [...tag_id, tag._id];
//         });
//       }
//       adv["tags"] = tag_id;
//       adv.save();
//       res.redirect(
//         `/api/paypal/adv/pay?price=${parseInt(5)}&path=${data.path}&adv_id=${
//           adv._id
//         }`
//       );
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).json(error.message);
//   }
// });

router.put("/:adv_id", middlewear.checkToken, Upload.array("images", 5), async (req, res) => {
  const data = req.body;
  const { adv_id } = req.params;
  const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    images: Joi.array(),
    tags: Joi.array(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    price: Joi.number(),
    user_id: Joi.string(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      if (req.files) {
        let file = req.files;
        let images = [];
        file.map((text) => {
          images = [...images, text.location];
        });
        data["images"] = images;
      } else {
        data["images"] = data.images;
      }
      let adv = await Adv.findByIdAndUpdate(
        adv_id,
        {
          $set: data,
        },
        { new: true }
      );
      res.status(200).json(adv);
    }
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/my_adv/:user_id", middlewear.checkToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    let adv = await Adv.find({ user_id: user_id, deleted: { $ne: true } })
      .sort({ _id: -1 })
      .populate({ path: "tags", select: "tag" });
    console.log("expired", adv);
    res.status(200).json(adv);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/", middlewear.checkToken, async (req, res) => {
  const { tag } = req.query;
  let page = 1;
  req.query.page ? (page = req.query.page) : null;
  let per_page = 30;
  try {
    if (tag) {
      let id = [];
      let tag_data = await Tag.find({ tag: { $regex: `^${tag}$`, $options: 'i' }, tag_type: "adv" });
      tag_data.map((text) => {
        id = [...id, text.object_id];
      });
      let adv = await Adv.find({ _id: { $in: id }, deleted: { $ne: true } })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .sort({ _id: -1 })
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        })
        .populate({ path: "tags", select: "tag" });

      res.status(200).json(adv);
    } else {
      let adv = await Adv.find({ deleted: { $ne: true } })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .sort({ _id: -1 })
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        })
        .populate({ path: "tags", select: "tag" });
      res.status(200).json(adv);
    }
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/:adv_id", middlewear.checkToken, async (req, res) => {
  const { adv_id } = req.params;
  try {
    let data = await Adv.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(adv_id) },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "adv_id",
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
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err.message);
  }
});
router.get("/admin/:adv_id", middlewear.checkToken, async (req, res) => {
  const { adv_id } = req.params;
  try {
    let data = await Adv.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(adv_id) },
      },
      {
        $lookup: {
          from: "flags",
          localField: "_id",
          foreignField: "adv_id",
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

router.delete("/:adv_id", middlewear.checkToken, async (req, res) => {
  const { adv_id } = req.params;
  try {
    let adv = await Adv.findByIdAndUpdate(
      adv_id,
      {
        $set: { deleted: true },
      },
      { new: true }
    );
    res.status(200).json(adv);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.delete("/", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  let email = req.decoded._id;
  try {
    console.log("check", data);
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
        let adv = await Adv.findByIdAndUpdate(
          ids[i],
          { $set: { deleted: true } },
          { new: true }
        );
        obj = [...obj, adv];
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

router.get("/view/:adv_id/:user_id", middlewear.checkToken, async (req, res) => {
  const { adv_id, user_id } = req.params;
  try {
    let adv = await Adv.findById(adv_id);
    if (!adv.views.includes(user_id)) {
      adv.views = [...adv.views, user_id];
    }
    res.status(200).json(adv);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/repost", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    adv_id: Joi.string().required(),
    path: Joi.string(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      res.redirect(
        `/api/paypal/adv/pay?price=${parseInt(5)}&path=${data.path}&adv_id=${data.adv._id
        }`
      );
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
