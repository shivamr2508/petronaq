const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
   googleLogin
} = require("../controllers/authController");


router.post("/google-login", googleLogin);

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;


