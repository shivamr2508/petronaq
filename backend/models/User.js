// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },

//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true,
     lowercase: true,
     required: true
  },

  password: {
    type: String
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other"
  },

  googleId: {
    type: String
  },

  profileImage: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  }

  // isVerified: {
  //   type: Boolean,
  //   default: false
  // }

},
{
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);