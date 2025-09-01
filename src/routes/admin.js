const express = require("express")
const { deleteAllContent, dropAllTables, dropAllProcedures } = require("../controllers/adminController")

const router = express.Router()

router.post("/admin/delete-all-content", deleteAllContent)
router.post("/admin/drop-all-tables", dropAllTables)
router.post("/admin/drop-all-procedures", dropAllProcedures)

module.exports = router