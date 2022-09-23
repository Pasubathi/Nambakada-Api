const parser = require("fast-xml-parser");
const express = require("express");
const nodeFetch = require("node-fetch");
const User = require("../model/user");
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
const Notification = require("../index");

const shippingHeaders = {
  Accept: "application/xml",
  "Content-Type": "application/xml",
};

async function eligibility(user_id) {
  try {
    let url = `http://3.13.217.144:4000/api/selling_details/${user_id}`;
    const response = await nodeFetch(url, { method: "GET" });
    const jsonResponse = await response.json();
    return jsonResponse
  } catch (error) {
    console.log(error, "Not Eligible");
    return error
  }
}

router.post("/", middlewear.checkToken, Upload.array("images", 10), async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    weight: Joi.string().required(),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postal_code: Joi.string().required(),
    // details: Joi.string(),
    price: Joi.number().required(),
    tags: Joi.array(),
    images: Joi.array(),
    image: Joi.array(),
    user_id: Joi.string().required(),
    length: Joi.string(),
    breadth: Joi.string(),
    height: Joi.string(),
    package: Joi.string(),
    app: Joi.boolean(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      const check = await eligibility(data.user_id);
      console.log(check, "CHECK");
      if (check && check.account_number) {
        let userId = "849HOPEU7325";
        let URLForZipVerification = `https://secure.shippingapis.com/ShippingAPI.dll?API= CityStateLookup&`;
        URLForZipVerification += `XML=<CityStateLookupRequest USERID="${userId}">`;
        URLForZipVerification += `<ZipCode ID="0"><Zip5>${data.postal_code}</Zip5></ZipCode></CityStateLookupRequest>`;

        let upsAddressValidationURL = `https://onlinetools.ups.com/addressvalidation/v1/1?regionalrequestindicator=true&maximumcandidatelistsize=10`;

        const upsBody = {
          XAVRequest: {
            AddressKeyFormat: {
              ConsigneeName: "",
              BuildingName: "",
              AddressLine: [],
              Region: "",
              PoliticalDivision2: "",
              PoliticalDivision1: "",
              PostcodePrimaryLow: data.postal_code,
              PostcodeExtendedLow: "",
              Urbanization: "",
              CountryCode: "US"
            }
          }
        }

        const upsHeaders = {
          AccessLicenseNumber: 'DDA269451F977D95',
          Username: 'Teasleymike',
          Password: "Ups123!",
        }

        const responseFromZipVerification = await nodeFetch(
          URLForZipVerification,
          {
            method: "POST",
            headers: shippingHeaders,
          }
        );

        const upsAddressApi = await nodeFetch(
          upsAddressValidationURL,
          {
            method: "POST",
            body: JSON.stringify(upsBody),
            headers: upsHeaders
          }
        );

        let upsResponse = await upsAddressApi.json()

        let zipVerificationInJson = await responseFromZipVerification.text();
        zipVerificationInJson = parser.parse(zipVerificationInJson);

        if (!zipVerificationInJson.CityStateLookupResponse.ZipCode.Error && upsResponse) {
          let tag_id = [];
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

          let product = new Product(data);

          let title_tag = new Tag({
            object_id: product._id,
            tag_type: "product",
            tag: data.title,
          });
          title_tag.save();

          tag_id = [...tag_id, title_tag._id];

          if (data.tags && data.tags.length > 0) {
            data.tags.map((text) => {
              let tag = new Tag({
                object_id: product._id,
                tag_type: "product",
                tag: text,
              });
              tag.save();
              tag_id = [...tag_id, tag._id];
            });
          }
          product["tags"] = tag_id;

          product.save((error, product) => {
            if (!error) {
              return res.status(200).json(product);
            } else {
              return res.status(400).json(error);
            }
          });
        } else {
          return res.status(400).json({
            message: "Invalid Address",
          });
        }
      } else {
        return res.status(400).json({ message: "You must have to upload your bank account details" })
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

router.put("/:product_id", middlewear.checkToken, Upload.array("images", 10), async (req, res) => {
  const data = req.body;
  const { product_id } = req.params;
  // const schema = Joi.object({
  //     title: Joi.string(),
  //     description: Joi.string(),
  //     weight: Joi.string(),
  //     price: Joi.number(),
  //     tags: Joi.array(),
  //     images: Joi.array(),

  // })
  try {
    // let value = await schema.validateAsync(data);
    // if (!value.error) {
    let images = [];
    // console.log("data", data)
    // if(Object.keys(data).length == 0){
    // data = formJson(data)
    // }
    console.log("data", data);
    if (req.files && req.files.length > 0) {
      console.log("files", req.files);
      let file = req.files;
      file.map((text) => {
        images = [...images, text.location];
      });
      data["images"] = images;
    }
    console.log("images", data.images);
    let product = await Product.findByIdAndUpdate(
      product_id,
      {
        $set: data,
      },
      { new: true }
    ).populate("tags");
    console.log("product", product);
    res.status(200).json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
});

router.get("/my_product/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    console.log("product", user_id);

    let product = await Product.find({
      user_id: user_id,
      deleted: { $ne: true },
    })
      .populate("tags")
      .sort({ _id: -1 });
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/", async (req, res) => {
  const { tag } = req.query;
  let page = 1;
  req.query.page ? (page = req.query.page) : null;
  let per_page = 80;
  console.log("tag", tag);
  try {
    if (tag) {
      console.log(tag);
      let id = [];
      let tag_data = await Tag.find({
        tag: { $regex: `^${tag}$`, $options: 'i' },
        tag_type: "product",
      });
      tag_data.map((text) => {
        id = [...id, text.object_id];
      });
      let product = await Product.find({
        _id: { $in: id },
        deleted: { $ne: true },
      })
        .sort({ _id: -1 })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        });
      console.log("persian", product);
      res.status(200).json(product);
    } else {
      let product = await Product.find({ deleted: { $ne: true } })
        .sort({ _id: -1 })
        .skip(per_page * page - per_page)
        .limit(per_page)
        .populate({
          path: "user_id",
          select: "username , first_name , last_name , profile_picture",
        });
      res.status(200).json(product);
    }
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/:product_id", async (req, res) => {
  const { product_id } = req.params;
  console.log("cehck", product_id);
  try {
    let data = await Product.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(product_id) },
      },
      {
        $match: { deleted: { $ne: true } },
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
          from: "reviews",
          localField: "_id",
          foreignField: "product_id",
          as: "reviews",
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
      {
        $lookup: {
          from: "flags",
          localField: "_id",
          foreignField: "product_id",
          as: "flag",
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/admin/:product_id", async (req, res) => {
  const { product_id } = req.params;
  console.log("cehck", product_id);
  try {
    let data = await Product.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(product_id) },
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
          from: "flags",
          localField: "_id",
          foreignField: "product_id",
          as: "flag",
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

router.delete("/:product_id", middlewear.checkToken, async (req, res) => {
  const { product_id } = req.params;
  try {
    let product = await Product.findByIdAndUpdate(
      product_id,
      {
        $set: { deleted: true },
      },
      { new: true }
    );
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.put("/like/:product_id", middlewear.checkToken, async (req, res) => {
  const { product_id } = req.params;
  try {
    let data = {};
    let foundProduct = await Product.findById(product_id);

    const found = foundProduct.likes.includes(req.body.likes[0]);
    if (found) {
      const index = foundProduct.likes.indexOf(req.body.likes[0]);
      foundProduct.likes.splice(index, 1);
    } else {
      foundProduct.likes.push(req.body.likes[0]);
    }

    data["likes"] = foundProduct.likes;

    let product = await Product.findByIdAndUpdate(
      product_id,
      { $set: data },
      { new: true }
    );

    res.status(200).json(product.likes);
  } catch (error) {
    res.status(400).json(error);
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
        let product = await Product.findByIdAndUpdate(
          ids[i],
          { $set: { deleted: true } },
          { new: true }
        );
        obj = [...obj, product];
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
