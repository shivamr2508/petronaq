// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "petronaq_products",
//     allowed_formats: ["jpg", "png", "jpeg", "webp"],
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;



const multer = require("multer");
// const  = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "petronaq_products",
      resource_type: "image",
      format: file.mimetype.split("/")[1], // auto detect jpg/png/webp
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

// const upload = multer({ storage });

// module.exports = upload;

module.exports = multer({ storage });