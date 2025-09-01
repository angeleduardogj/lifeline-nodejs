require("dotenv").config()

const express = require("express")
const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const { Resend } = require("resend");
const { CORS_OPTIONS } = require("./config/constants")

// Importar rutas
const authRoutes = require("./routes/auth")
const inventoryRoutes = require("./routes/inventory")
const emailRoutes = require("./routes/email")
const subscriptionRoutes = require("./routes/subscription")
const adminRoutes = require("./routes/admin")

const app = express()

// Middlewares globales
app.use(express.json())
app.use(cookieParser())
app.use(cors(CORS_OPTIONS))

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀V2")
})

// Usar las rutas
app.use("/", authRoutes)
app.use("/", inventoryRoutes)
app.use("/", emailRoutes)
app.use("/", subscriptionRoutes)
app.use("/", adminRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`)
})

