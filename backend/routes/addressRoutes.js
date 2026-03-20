const express = require("express");
const router = express.Router();

const {
  getAddresses,
  addAddress,
  deleteAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAddresses);

router.post("/", protect, addAddress);

router.delete("/:id", protect, deleteAddress);

module.exports = router;