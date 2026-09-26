const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch
} = require("../controllers/batch.controller");

const router = express.Router();


// Logged-in users can view batches
router.get("/", protect, getBatches);


// Logged-in users can view one batch
router.get("/:id", protect, getBatchById);


// Admin can create batch
router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createBatch
);


// Admin can update batch
router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateBatch
);


// Admin can delete batch
router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteBatch
);


module.exports = router;