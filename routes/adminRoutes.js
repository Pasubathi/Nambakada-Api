const express = require("express");
const User = require("../model/admin");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require('@hapi/joi');
const crypto = require('crypto');
const AdminNotification = require('../model/admin_notifications')


router.post("/login", async (req, res, err) => {
  let data = req.body;
  const schema = Joi.object({
    password: Joi.string().required(),
    email: Joi.string().required(),

  });
  try {
    const value = await schema.validateAsync(data);
    if (!value.error) {
      let user;
      user = await User.findOne({ email: data.email });

      if (!user) {
        return res.status(404).json({ error: true, message: "User not found" });
      }
      if (!user.authentication(data.password)) {
        return res.status(401).json({ error: true, message: "Password incorrect" });
      }
      let token = jwt.sign({ _id: user.email }, config.secret_key, {
        expiresIn: "24h", // expires in 24 hours
      });
      user.hash_password = undefined;
      user.salt = undefined;

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.json({
        success: true,
        token: token,
        status: "you are succesfully loged in",
        data: user,
      });


    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
      error: true

    });
  }

});


router.post("/signup", async (req, res) => {
  const data = req.body;
  console.log("post", data)
  try {
    const schema = Joi.object({
      password: Joi.string().required(),
      email: Joi.string().email(),
    });

    const value = await schema.validateAsync(data);
    if (!value.error) {
      const { email } = req.body;
      const existemail = await User.findOne({ email });
      console.log("exsist", existemail)
      if (existemail) {
        console.log({ existemail, existUser })
        return res.status(403).json({ message: "Email or Username Already exists", error: true });
      }
      else {
        let user = new User(data);
        user.save((err, user) => {
          console.log(err, user, "saveuser")
          if (!err) {
            user.salt = undefined;
            user.hash_password = undefined;
            console.log('done', user)

            res.status(200).json({
              message: "Your Account is Successfully Created",
              data: user,
              error: false

            });
          } else {
            res.status(400).json({ error: true, message: err });
          }
        })
      }
    }
  } catch (err) {
    console.log(err)
    res.status(400).json({
      message: err.message,
      error: true
    });
  }
});

router.post("/create-subAdmin", middlewear.checkToken, async (req, res) => {
  let data = req.body;
  const schema = Joi.object({
    email: Joi.string(),
    password: Joi.string(),
    first_name: Joi.string(),
    last_name: Joi.string(),
    access: Joi.object({
      delete: Joi.bool(),
      return: Joi.bool(),
      flagged: Joi.bool(),
      tracking: Joi.bool(),
      marketing: Joi.bool(),
      manage_admins: Joi.bool(),
      help_center: Joi.bool()
    })
  })
  try {
    const value = schema.validateAsync(data);
    if (!value.error) {
      const { email } = req.body;
      const existemail = await User.findOne({ email });
      if (existemail) {
        return res.status(403).json({ message: "Email or Username Already exists", error: true });
      } else {
        let user = new User(data);
        user.save((err, user) => {
          console.log(err, user, "saveuser")
          if (!err) {
            user.salt = undefined;
            user.hash_password = undefined;
            res.status(200).json({
              message: "Account is Successfully Created",
              data: user,
              error: false
            });
          } else {
            res.status(400).json({ error: true, message: err });
          }
        })
      }
    }
  } catch (error) {
    res.status(400).json({
      message: err.message,
      error: true
    });
  }
})

router.get("/list-admins", middlewear.checkToken, async (req, res) => {
  try {
    let per_page = 30;
    let page = 1;
    req.query.page ? page = req.query.page : null;
    let user;
    req.query.name ?
      user = await User.find({ deleted: { $ne: true }, first_name: { $regex: req.query.name } }).skip(per_page * page - per_page).limit(50).select("username , first_name , last_name , email")
      : user = await User.find({ deleted: { $ne: true } }).sort({ _id: -1 }).skip(per_page * page - per_page).limit(50).select("username , first_name , last_name , email");
    //{deleted :{$ne:true}}
    res.status(200).json({
      error: false,
      data: user
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: true,
      message: err.message
    })
  }
})

router.delete("/delete-admin/:admin_id", middlewear.checkToken, async (req, res) => {
  let { admin_id } = req.params;
  console.log(req.params, "PARASM")
  try {
    await User.findByIdAndDelete(admin_id, function (err, docs) {
      if (err) {
        throw err
      } else {
        console.log("Deleted : ", docs);
        return res.status(200).json(docs)
      }
    });
  } catch (error) {
    console.log(error, "E");
    return res.status(400).json(error)
  }
})

router.get("/admin_notifee", async (req, res) => {
  const notifications = await AdminNotification.find();
  res.status(200).json(notifications)
})

module.exports = router;
