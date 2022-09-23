const express = require("express");
const User = require("../model/user");
const middlewear = require("../middleware");
const mongoose = require("mongoose");
var router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const Joi = require("@hapi/joi");
const Email = require("../email");
const EmailN = require("../email_notification");
const crypto = require("crypto");
const Upload = require("../s3.js").uploadVideo;
const path = require("path");
const Prodcut = require("../model/product");
const Video = require("../model/video");
const Adv = require("../model/adv");

const link = `${config.backendUrl}/api/user/verify/`;

router.post("/signup", async (req, res) => {
  const data = req.body;
  console.log("post", data);
  try {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().min(8).required(),
      email: Joi.string().email(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
    });

    const value = await schema.validateAsync(data);
    if (!value.error) {
      const { email, username } = req.body;
      const existemail = await User.findOne({ email });
      const existUser = await User.findOne({ username });
      console.log("exsist", existemail);
      if (existemail || existUser) {
        console.log({ existemail, existUser });
        return res
          .status(403)
          .json({ message: "Email or Username Already exists", error: true });
      }
      // const existUser = await User.findOne({ username });
      // if (existUser) {

      //   return res.status(403).json({ message: "Username Already exists", error: true });
      // }
      else {
        let token = crypto.randomBytes(3);
        token = token.toString("hex");
        console.log("start");
        data["token"] = token;
        let user = new User(data);
        user.save((err, user) => {
          console.log(err, user, "saveuser");
          if (!err) {
            user.salt = undefined;
            user.hash_password = undefined;
            console.log("done", user);
            EmailN.accountVerficationEmail(
              user.email,
              "Verify Account",
              `Click on this link to verify account ${link}${user._id}/${user.token}`,
              (iserr, err) => {
                if (!iserr) {
                  // res.status(200).json({ error: false, message: "Email has Successfully sended" });
                } else {
                  // res.status(400).json({ error: true, message: err });
                }
              }
            );
            res.status(200).json({
              message: "Your Account is Successfully Created",
              data: user,
              error: false,
            });
          } else {
            res.status(400).json({ error: true, message: err });
          }
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err.message,
      error: true,
    });
  }
});

router.put(
  "/:user_id",
  middlewear.checkToken,
  Upload.single("profile_picture"),
  async (req, res) => {
    const data = req.body;

    try {
      const schema = Joi.object({
        password: Joi.string(),
        first_name: Joi.string(),
        last_name: Joi.string(),
        profile_picture: Joi.string(),
        deleted: Joi.boolean(),
        notification: Joi.boolean(),
        email_notification: Joi.boolean(),
      });
      const { user_id } = req.params;
      const value = await schema.validateAsync(data);
      if (!value.error) {
        if (req.file) {
          data["profile_picture"] = req.file.location;
        } else {
          data["profile_picture"] = data.profile_picture;
        }
        const user = await User.findByIdAndUpdate(
          user_id,
          {
            $set: data,
          },
          { new: true }
        );

        res.status(200).json(user);
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({
        message: err.message,
        error: true,
      });
    }
  }
);

router.get("/", middlewear.checkToken, async (req, res) => {
  try {
    let per_page = 30;
    let page = 1;
    req.query.page ? (page = req.query.page) : null;
    let user;
    req.query.name
      ? (user = await User.find({
          deleted: { $ne: true },
          first_name: { $regex: req.query.name },
        })
          .skip(per_page * page - per_page)
          .limit(50)
          .select("username , first_name , last_name , email"))
      : (user = await User.find({ deleted: { $ne: true } })
          .sort({ _id: -1 })
          .skip(per_page * page - per_page)
          .limit(50)
          .select("username , first_name , last_name , email"));
    //{deleted :{$ne:true}}
    res.status(200).json({
      error: false,
      data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

router.get("/:user_id", middlewear.checkToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findOne({ _id: user_id });
    if (user) {
      console.log(user, "SUCCESS");
      res.status(200).json({
        data: user,
      });
    } else {
      console.log("fix api");
    }
  } catch (err) {
    res.status(400).json({
      error: true,
      message: err.message,
    });
  }
});

router.post("/login", async (req, res, err) => {
  console.log("hi", req);
  let data = req.body;
  const schema = Joi.object({
    password: Joi.string().required(),
    email: Joi.string().required(),
    token: Joi.string(),
  });
  console.log(data, "running");
  try {
    const value = await schema.validateAsync(data);
    if (!value.error) {
      let user;
      user = await User.findOne({ email: data.email, deleted: { $ne: true } });
      if (!user) {
        console.log("S");
        user = await User.findOne({
          username: data.email,
          deleted: { $ne: true },
        });
        return res.status(404).json({ error: true, message: "User not found" });
      } else if (user && user.deleted) {
        console.log("SS");
        return res
          .status(410)
          .json({
            error: true,
            message:
              "Your Account has been deleted by Admin , Please Contact Customer Care",
          });
      } else if (user && !user.verified) {
        console.log("SSS");
        return res
          .status(422)
          .json({
            error: true,
            message: "Your Account is not Verified , Verify Your Email First",
          });
      }

      if (!user.authentication(data.password)) {
        return res
          .status(401)
          .json({ error: true, message: "Password incorrect" });
      }
      let token = jwt.sign({ _id: user._id }, config.secret_key, {
        expiresIn: "30 days", // expires in 24 hours
      });
      user.token = data.token;
      user.isLoggedin = true;
      user.save();
      console.log("user_last", user);
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      let obj = {
        verified: user.verified,
        deleted: user.deleted,
        _id: user._id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        createdAt: user.createdAt,
        profile_picture: user.profile_picture,
      };
      res.json({
        success: true,
        token: token,
        status: "you are succesfully loged in",
        data: obj,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err.message,
      error: true,
    });
  }
});

router.post("/logout/:id", middlewear.checkToken, async (req, res) => {
  const user_id = req.params;
  console.log(user_id, "USER ID WANTs TO LOGOUT");
  let logout_user = await User.findByIdAndUpdate(
    user_id.id,
    {
      $set: { isLoggedin: false, token: "" },
    },
    { new: true }
  );

  res
    .status(200)
    .json({ user: logout_user, message: "user Logged out successfully" });
});

router.delete("/:id", middlewear.checkToken, async (req, res) => {
  const data = req.params;
  let email = req.decoded._id;
  try {
    console.log("check", data);
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const value = await schema.validateAsync(data);
    if (!value.error) {
      if (email != config.hopeup_admin) {
        return res
          .status(200)
          .json({ error: true, message: "You can not perform this operation" });
      }

      let product = await Prodcut.updateMany(
        { user_id: data.id },
        { $set: { deleted: true } }
      );
      console.log("product", product);
      let video = await Video.updateMany(
        { user_id: data.id },
        { $set: { deleted: true } }
      );
      let adv = await Adv.updateMany(
        { user_id: data.id },
        { $set: { deleted: true } }
      );
      let user = await User.findByIdAndUpdate(
        data.id,
        {
          $set: { deleted: true },
        },
        { new: true }
      );
      //let ids = data.ids;
      // let obj = []
      // console.log("ids" , data)
      // for(let i =0 ; i < ids.length ; i++){
      //   let user = await User.findByIdAndUpdate(ids[i] , {$set :{deleted : true }} , {new : true});
      //   obj = [...obj , user]
      // }

      res
        .status(200)
        .json({
          error: true,
          message: "Successfully deleted",
          deletedItems: user,
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

router.post("/forget_password", async (req, res) => {
  let token = crypto.randomBytes(3);
  token = token.toString("hex");
  console.log("t ", token);
  let obj = {
    reset_password_token: token,
    reset_password_expires: Date.now() + 86400000,
  };
  let user = await User.findOneAndUpdate(
    { email: req.body.email },
    {
      $set: obj,
    },
    { new: true }
  );

  EmailN.forgetEmail(
    req.body.email,
    "Your password Reset Link is Here",
    `your password reset token is ${token}`,
    (iserr, err) => {
      if (!iserr) {
        res
          .status(200)
          .json({ error: false, message: "Email has Successfully been sent" });
      } else {
        res.status(400).json({ error: true, message: err });
      }
    }
  );
});

router.post("/change_password", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    reset_password_token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  });
  try {
    const value = schema.validateAsync(data);
    if (!value.error) {
      let user = await User.findOne({
        reset_password_token: data.reset_password_token,
        reset_password_expires: { $gt: Date.now() },
      });
      user.password = data.password;
      user.reset_password_token = undefined;
      user.reset_password_expires = undefined;
      user.save();
      res.status(200).json({
        error: false,
        message: "Sucessfully updated",
      });
    }
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});

router.get(
  "/verify/:user_id/:token",
  middlewear.checkToken,
  async (req, res) => {
    const data = req.params;
    const schema = Joi.object({
      user_id: Joi.string().required(),
      token: Joi.string().required(),
    });
    try {
      const value = schema.validateAsync(data);
      if (!value.error) {
        console.log("start", data);
        let user = await User.findById(data.user_id);
        if ((user.token = data.token)) {
          user.verified = true;
          user.save();
          res.sendFile(path.join(__dirname, "../index.html"));
        } else {
          res.status(400).json("Invalid token");
        }
      }
    } catch (err) {
      console.log("err", err);
      res.status(400).json({ err: err.message });
    }
  }
);

module.exports = router;
