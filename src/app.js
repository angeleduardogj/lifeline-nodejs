require("dotenv").config()
const express = require("express")
const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const cors = require("cors") // Add this line

const app = express()
app.use(express.json())
app.use(cookieParser())

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 3600000, // 1 hora
  path: "/",
}

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}))

// Middleware para verificar el token JWT
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

// Función auxiliar para estandarizar las respuestas
function standardResponse(message, data = null, error = null) {
  return { message, data, error }
}

app.get("/", (req, res) => {
  res.send("🚀");
});


app.post("/type", async (req, res) => {
  const { name, description, entityType } = req.body

  try {
    const result = await pool.query("CALL create_type($1, $2, $3, NULL)", [name, description, entityType])

    const createdType = {
      id: result.rows[0].o_id,
      name,
      description,
      entityType,
    }

    res.status(201).json(standardResponse("Tipo creado exitosamente", createdType))
  } catch (error) {
    console.error("Error al crear tipo:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta para crear una suscripción
app.post("/subscription", async (req, res) => {
  const { name, description, price, billingPeriod } = req.body

  try {
    const result = await pool.query("CALL create_subscription($1, $2, $3, $4, NULL)", [
      name,
      description,
      price,
      billingPeriod,
    ])

    const createdSubscription = {
      id: result.rows[0].o_id,
      name,
      description,
      price,
      billingPeriod,
    }

    res.status(201).json(standardResponse("Suscripción creada exitosamente", createdSubscription))
  } catch (error) {
    console.error("Error al crear suscripción:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta de registro (signup)
app.post("/signup", async (req, res) => {
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
})

// Ruta de inicio de sesión
app.post("/login", async (req, res) => {
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
})

// Ruta protegida para obtener datos del usuario
app.get("/user-data", verifyToken, async (req, res) => {
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
})

// Endpoint para eliminar todo el contenido de las tablas
app.post("/admin/delete-all-content", async (req, res) => {
  try {
    await pool.query("CALL sp_delete_all_data()")
    res.json(standardResponse("Todo el contenido ha sido eliminado de todas las tablas."))
  } catch (error) {
    console.error("Error al eliminar el contenido:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Endpoint para eliminar todas las tablas y vistas
app.post("/admin/drop-all-tables", async (req, res) => {
  try {
    await pool.query("CALL sp_drop_all_tables()")
    res.json(standardResponse("Todas las tablas y vistas han sido eliminadas."))
  } catch (error) {
    console.error("Error al eliminar las tablas y vistas:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Endpoint para eliminar todos los procedimientos almacenados excepto los especificados
app.post("/admin/drop-all-procedures", async (req, res) => {
  try {
    await pool.query("CALL sp_drop_all_procedures()")
    res.json(standardResponse("Todos los procedimientos almacenados han sido eliminados, excepto los especificados."))
  } catch (error) {
    console.error("Error al eliminar los procedimientos almacenados:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta para crear un nuevo inventario
app.post("/inventory", async (req, res) => {
  const { name, description, type, questions } = req.body

  try {
    const result = await pool.query("CALL create_inventory($1, $2, $3, $4, NULL)", [
      name,
      description,
      type,
      JSON.stringify(questions),
    ])

    const createdInventory = {
      id: result.rows[0].o_id,
      name,
      description,
      type,
      questions,
    }

    res.status(201).json(standardResponse("Inventario creado exitosamente", createdInventory))
  } catch (error) {
    console.error("Error al crear inventario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta para obtener los detalles de un inventario
app.get("/inventory/:inventoryId", async (req, res) => {
  const { inventoryId } = req.params

  try {
    const result = await pool.query("SELECT * FROM get_inventory_details($1)", [inventoryId])

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(
          standardResponse("Inventario no encontrado", null, "No se encontró el inventario con el ID proporcionado"),
        )
    }

    const inventoryDetails = result.rows[0]

    res.json(standardResponse("Detalles del inventario obtenidos exitosamente", inventoryDetails))
  } catch (error) {
    console.error("Error al obtener detalles del inventario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta para crear una respuesta de inventario
app.post("/inventory/:inventoryId/response", async (req, res) => {
  const { inventoryId } = req.params
  const { respondentName, answers } = req.body

  try {
    const result = await pool.query("CALL create_inventory_response($1, $2, $3, NULL)", [
      inventoryId,
      respondentName,
      JSON.stringify(answers),
    ])

    const createdResponse = {
      id: result.rows[0].o_id,
      inventoryId,
      respondentName,
      answers,
    }

    res.status(201).json(standardResponse("Respuesta de inventario creada exitosamente", createdResponse))
  } catch (error) {
    console.error("Error al crear respuesta de inventario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

// Ruta para obtener respuestas de un inventario por ID de respuesta
app.get("/inventory/:responseId/responses", async (req, res) => {
  const { responseId } = req.params

  try {
    console.log('Buscando respuesta con ID:', responseId); // Debug log

    const result = await pool.query("SELECT * FROM get_inventory_responses($1)", [responseId])
    
    console.log('Resultado de la consulta:', result.rows); // Debug log

    const responses = result.rows.map((row) => ({
      id: row.response_id,
      respondentName: row.respondent_name,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers,
      createdAt: row.created_at
    }))

    res.json(standardResponse("Respuestas del inventario obtenidas exitosamente", responses))
  } catch (error) {
    console.error("Error detallado al obtener respuestas del inventario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})



app.get('/inventory-responses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM get_all_inventory_responses()');

    console.log('Estructura de la primera fila:', Object.keys(result.rows[0]));
    console.log('Tipos de datos:', result.rows[0] ? Object.entries(result.rows[0]).map(([key, value]) => `${key}: ${typeof value}`) : 'No hay filas');

    const responses = result.rows.map(row => ({
      id: row.id,
      inventoryId: row.inventory_id,
      respondentName: row.respondent_name,
      answers: row.answers,
      createdAt: row.created_at
    }));

    res.json(standardResponse("Todas las respuestas de inventarios obtenidas exitosamente", responses));
  } catch (error) {
    console.error('Error al obtener las respuestas de inventarios:', error);
    res.status(500).json(standardResponse("Error en el servidor", null, error.message));
  }
});

app.post("/logout", verifyToken, async (req, res) => {
  try {
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1]
    
    // Invalidar la sesión en la base de datos usando el stored procedure
    await pool.query("CALL end_user_session($1, $2)", [req.userId, token])

    // Limpiar la cookie del token
    res.clearCookie("token", COOKIE_OPTIONS)

    res.json(standardResponse("Sesión cerrada exitosamente"))
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

app.get("/inventories", async (req, res) => {
  try {
    const query = "SELECT * FROM get_inventories()"
    const result = await pool.query(query)
    res.json(standardResponse("Inventarios obtenidos exitosamente", result.rows))
  } catch (error) {
    console.error("Error al obtener inventarios:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`)
})

