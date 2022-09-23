const express = require("express");
var router = express.Router();
const Joi = require('@hapi/joi');
const charges = require("../model/charges");
const middlewear = require("../middleware");

router.post("/create", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  console.log(data,"RUNNINGCHARHE")
  const schema = Joi.object({
    chargeId: Joi.string().required(),
    user_id: Joi.string().required(),
    charge_type: Joi.string().valid("advertise", "product", "contribute").required(),
    amount: Joi.number(),
    chargeTypeId: Joi.string().required(),
    receiptUrl: Joi.string()
  })
  try {
    let value = schema.validateAsync(data);
    if (!value.error) {
      let charge = new charges(data);
      charge.save();
      return res.status(200).json({ hasError: false, data: charge, message: "Charge created Successfully." })
    }
  } catch (error) {
    return res.status(400).json({ hasError: true, error: error, message: "Charge not created due to errors" })
  }
})

router.get("/:chargeId", middlewear.checkToken, async (req, res) => {
  const { chargeId } = req.params;
  try {
    charges.findById(chargeId, (error, response) => {
      if (error) {
        throw error;
      } else {
        return res.status(200).json({ hasError: false, data: response, message: "Success" })
      }
    })
  } catch (error) {
    return res.status(400).json({ hasError: true, error: error, message: "No Charge Found" })
  }
})

module.exports = router;