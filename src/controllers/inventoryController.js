const pool = require("../config/database")
const { standardResponse } = require("../utils/response")

const createInventory = async (req, res) => {
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
}

const getInventoryDetails = async (req, res) => {
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
}

const createInventoryResponse = async (req, res) => {
  const { inventoryId } = req.params
  const { respondentName, answers, medicalRecord } = req.body 

  try {
    const result = await pool.query("CALL create_inventory_response($1, $2, $3, $4, NULL)", [
      inventoryId,
      respondentName,
      JSON.stringify(answers),
      medicalRecord 
    ])

    const createdResponse = {
      id: result.rows[0].o_id,
      inventoryId,
      respondentName,
      answers,
      medicalRecord 
    }

    res.status(201).json(standardResponse("Respuesta de inventario creada exitosamente", createdResponse))
  } catch (error) {
    console.error("Error al crear respuesta de inventario:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

const getInventoryResponses = async (req, res) => {
  const { responseId } = req.params

  try {
    console.log('Buscando respuesta con ID:', responseId)
    const result = await pool.query("SELECT * FROM get_inventory_responses($1)", [responseId])
    console.log('Resultado de la consulta:', result.rows)

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
}

const getAllInventoryResponses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM get_all_inventory_responses()')
    const responses = result.rows.map(row => ({
      id: row.id,
      inventoryId: row.inventory_id,
      medical_record: row.medical_record,
      respondentName: row.respondent_name,
      answers: row.answers,
      createdAt: row.created_at
    }))
    res.json(standardResponse("Todas las respuestas de inventarios obtenidas exitosamente", responses))
  } catch (error) {
    console.error('Error al obtener las respuestas de inventarios:', error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

const getInventories = async (req, res) => {
  try {
    const query = "SELECT * FROM get_inventories()"
    const result = await pool.query(query)
    res.json(standardResponse("Inventarios obtenidos exitosamente", result.rows))
  } catch (error) {
    console.error("Error al obtener inventarios:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

module.exports = {
  createInventory,
  getInventoryDetails,
  createInventoryResponse,
  getInventoryResponses,
  getAllInventoryResponses,
  getInventories
}