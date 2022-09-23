const express = require("express");
const User = require("../model/user");
var router = express.Router();
const HelpCenter = require('../model/help_center');
const { restart } = require("nodemon");

router.get("/all", async (req, res) => {
  try {
    let groups = await HelpCenter.find()
      .populate('user_id').sort({ _id: -1 });
    return res.status(200).json(groups)
  } catch (error) {
    return res.status(400).json({ error })
  }
})

router.get("/group/:user_id", async (req, res) => {
  try {
    let find_group = await HelpCenter.findOne({ user_id: req.params.user_id })
      .populate('user_id').sort({ _id: -1 });
    return res.status(200).json(find_group)
  } catch (error) {
    return res.status(400).json({ error })
  }
})

router.post("/create/:user_id", async (req, res) => {
  const data = req.body;
  const group = await HelpCenter.findOne({ user_id: req.params.user_id });
  try {
    if (group) {
      console.log("group_found");
      const resposne = await HelpCenter.findByIdAndUpdate(group._id, {
        $set: { message: data.message }
      }, { new: true });
      return res.status(200).json(resposne)
    } else {
      const Group = new HelpCenter({
        user_id: req.params.user_id,
        message: "Hi",
        expired: false
      });
      Group.save();
      return res.status(200).json(Group)
    }
  } catch (error) {
    return res.status(400).json(error)
  }
})

router.patch("/update-message", async (req, res) => {
  let data = req.body;
  try {
    let updated = await HelpCenter.updateOne(
      { _id: data.group_id },
      { $set: { message: data.message } }
    );
    console.log(updated, "UP")
    if (updated) return res.status(200).json(updated);
    throw updated
  } catch (error) {
    res.status(400).json(error)
  }
})



module.exports = router;
