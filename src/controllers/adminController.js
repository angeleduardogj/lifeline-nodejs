const pool = require("../config/database")
const { standardResponse } = require("../utils/response")

const deleteAllContent = async (req, res) => {
  try {
    await pool.query("CALL sp_delete_all_data()")
    res.json(standardResponse("Todo el contenido ha sido eliminado de todas las tablas."))
  } catch (error) {
    console.error("Error al eliminar el contenido:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

const dropAllTables = async (req, res) => {
  try {
    await pool.query("CALL sp_drop_all_tables()")
    res.json(standardResponse("Todas las tablas y vistas han sido eliminadas."))
  } catch (error) {
    console.error("Error al eliminar las tablas y vistas:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

const dropAllProcedures = async (req, res) => {
  try {
    await pool.query("CALL sp_drop_all_procedures()")
    res.json(standardResponse("Todos los procedimientos almacenados han sido eliminados, excepto los especificados."))
  } catch (error) {
    console.error("Error al eliminar los procedimientos almacenados:", error)
    res.status(500).json(standardResponse("Error en el servidor", null, error.message))
  }
}

module.exports = {
  deleteAllContent,
  dropAllTables,
  dropAllProcedures
}