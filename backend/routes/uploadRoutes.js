// const express = require("express");
// const router = express.Router();

// const { protect, admin } = require("../middleware/authMiddleware");

// const upload = require("../middleware/uploadMiddleware");

// router.post("/", protect, admin, upload.single("image"), (req, res) => {

//   if (!req.file) {
//     return res.status(400).json({
//       message: "No file uploaded",
//     });
//   }

//   res.json({
//     url: req.file.path,
//   });

// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();

// const { protect, admin } = require("../middleware/authMiddleware");
// const upload = require("../middleware/uploadMiddleware");

// router.post("/", protect, admin, (req, res) => {

//   upload.single("image")(req, res, function (err) {

//     if (err) {
//       console.error("UPLOAD ERROR:", err);
//       return res.status(500).json({
//         message: err.message,
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         message: "No file uploaded",
//       });
//     }

//     res.json({
//       url: req.file.path,
//     });

//   });

// });

// module.exports = router;




const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");


router.post("/", protect, admin, upload.single("image"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "petronaq_products"
      }
    );

    res.json({
      url: result.secure_url
    });

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});

// Dedicated Pet Photo Upload Route
// @route   POST /api/upload/pet
// @access  Private (Logged-in users)
router.post("/pet", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // 1. File Type Validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: "Unsupported file type. Only JPG, PNG, and WEBP are allowed." 
      });
    }

    // 2. File Size Validation (5 MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ 
        success: false, 
        message: "File is too large. Maximum size is 5 MB." 
      });
    }

    // 3. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "petronaq/pets"
      }
    );

    // 4. Return secure URL
    res.status(200).json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    // Do not log secrets or sensitive data
    console.error("PET PHOTO UPLOAD ERROR:", error.message || error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during image upload" 
    });
  }
});

module.exports = router;