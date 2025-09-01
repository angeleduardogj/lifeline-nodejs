const jwt = require("jsonwebtoken")
const pool = require("../config/database")
const { JWT_SECRET } = require("../config/constants")

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1]
  if (!token) {
    return res.status(403).json({ message: "No se proporcionó token" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId

    // Verificar si la sesión aún existe en la base de datos
    const result = await pool.query(
      "SELECT * FROM user_sessions WHERE user_id = $1 AND token = $2 AND revoked_at IS NULL",
      [req.userId, token],
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Sesión no válida" })
    }

    next()
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return res.status(401).json({ message: "Token no válido o expirado" })
  }
}

module.exports = { verifyToken }