const pool = require("../config/database")
const { standardResponse } = require("../utils/response")

const createType = async (req, res) => {
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
}

const createSubscription = async (req, res) => {
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
}

module.exports = {
  createType,
  createSubscription
}