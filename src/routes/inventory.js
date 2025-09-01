const express = require("express")
const {
  createInventory,
  getInventoryDetails,
  createInventoryResponse,
  getInventoryResponses,
  getAllInventoryResponses,
  getInventories
} = require("../controllers/inventoryController")

const router = express.Router()

router.post("/inventory", createInventory)
router.get("/inventory/:inventoryId", getInventoryDetails)
router.post("/inventory/:inventoryId/response", createInventoryResponse)
router.get("/inventory/:responseId/responses", getInventoryResponses)
router.get("/inventory-responses", getAllInventoryResponses)
router.get("/inventories", getInventories)

module.exports = router