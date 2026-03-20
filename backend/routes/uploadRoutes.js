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

module.exports = router;