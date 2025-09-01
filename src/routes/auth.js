const express = require("express")
const { signup, login, getUserData, logout } = require("../controllers/authController")
const { verifyToken } = require("../middleware/auth")

const router = express.Router()

router.post("/signup", signup)
router.post("/autorizar", login)
router.get("/user-data", verifyToken, getUserData)
router.post("/logout", verifyToken, logout)

module.exports = router