const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")
const { JWT_SECRET, COOKIE_OPTIONS } = require("../config/constants")
const { standardResponse } = require("../utils/response")

const signup = async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    accountTypeId,
    userTypeId,
    subscriptionId,
    companyName,
    address,
    phone,
    taxId,
    website,
  } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      "CALL create_user_and_account($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL, NULL)",
      [
        username,
        email,
        hashedPassword,
        firstName,
        lastName,
        accountTypeId,
        userTypeId,
        subscriptionId,
        companyName,
        address,
        phone,
        taxId,
        website,
      ],
    )

    res.status(201).json(
      standardResponse("Usuario y cuenta registrados exitosamente", {
        accountId: result.rows[0]?.o_account_id,
        userId: result.rows[0]?.o_user_id,
      }),
    )
  } catch (error) {
    console.error("Error en el registro:", error)
    res.status(500).json(
      standardResponse("Error en el servidor", null, {
        message: error.message,
        detail: error.detail,
      }),
    )
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res
      .status(400)
      .json(standardResponse("Error en el login", null, "Falta el correo electrónico o la contraseña"))
  }

  try {
    const result = await pool.query("SELECT * FROM verify_user_credentials($1)", [email])

    if (result.rows.length === 0) {
      return res.status(401).json(standardResponse("Error en el login", null, "Credenciales inválidas"))
    }

    const user = result.rows[0]
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json(standardResponse("Error en el login", null, "Contraseña incorrecta"))
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" })

    await pool.query("CALL create_user_session($1, $2, $3, $4, NULL)", [user.id, token, req.ip, req.get("User-Agent")])

    res.cookie("token", token, COOKIE_OPTIONS)

    res.status(200).json(
      standardResponse("Login exitoso", {
        token,
        user: {
          id: user.id,
          accountId: user.account_id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          accountType: user.account_type_id,
          userType: user.user_type_id,
          subscription: user.subscription_id,
        },
      }),
    )
  } catch (error) {
    console.error("Error en el login:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, "Ocurrió un error durante el login"))
  }
}

const getUserData = async (req, res) => {
  try {
    const userId = req.userId
    const result = await pool.query("SELECT * FROM get_user_data($1)", [userId])

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(standardResponse("Usuario no encontrado", null, "No se encontró el usuario con el ID proporcionado"))
    }

    const userData = result.rows[0]

    res.json(
      standardResponse("Datos del usuario obtenidos exitosamente", {
        id: userData.user_id,
        accountId: userData.account_id,
        username: userData.username,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        accountTypeId: userData.account_type_id,
        userTypeId: userData.user_type_id,
        subscriptionId: userData.subscription_id,
      }),
    )
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

const logout = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1]
    
    await pool.query("CALL end_user_session($1, $2)", [req.userId, token])
    res.clearCookie("token", COOKIE_OPTIONS)
    res.json(standardResponse("Sesión cerrada exitosamente"))
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

module.exports = {
  signup,
  login,
  getUserData,
  logout
}