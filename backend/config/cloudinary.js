// const cloudinary = require("cloudinary").v2;

// cloudinary.config ({
//   cloud_name: process.env.CLOUDINARY_NAME,
//   api_key: process.env.CLOUDINARY_KEY,
//   api_secret: !!process.env.CLOUDINARY_SECRET  ? "exists" : "missing"
// });



// module.exports = cloudinary;




// const cloudinary = require("cloudinary").v2;

// cloudinary.config({
//   secure: true
// });

// console.log("Cloudinary configured via CLOUDINARY_URL");

// module.exports = cloudinary;


// const cloudinary = require("cloudinary").v2;

// console.log("CLOUDINARY_URL exists:", !!process.env.CLOUDINARY_URL);

// cloudinary.config({
//   cloudinary_url: process.env.CLOUDINARY_URL
// });

// module.exports = cloudinary;



const cloudinary = require("cloudinary").v2;

// THIS LINE FIXES THE ISSUE
cloudinary.config(process.env.CLOUDINARY_URL);

console.log("Cloudinary fully configured");

module.exports = cloudinary;