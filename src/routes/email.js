const express = require("express")
const { sendContact } = require("../controllers/emailController")

const router = express.Router()

router.post("/send-contact", sendContact)

module.exports = router