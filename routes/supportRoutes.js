const express = require("express");
const User = require("../model/user");
var router = express.Router();
const Support = require("../model/support");
const HelpCenter = require("../model/help_center");

router.get("/all_message/:group_id", async (req, res) => {
  //middlewear.checkToken,
  const { group_id } = req.params;
  try {
    const messages = await Support.find({ group_id });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
