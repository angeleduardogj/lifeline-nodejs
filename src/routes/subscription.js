const express = require("express")
const { createType, createSubscription } = require("../controllers/subscriptionController")

const router = express.Router()

router.post("/type", createType)
router.post("/subscription", createSubscription)

module.exports = router