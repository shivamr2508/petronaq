const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: "" },
  type: { type: String, default: "primary" }, // e.g., primary, emergency, vet
  isPrimary: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true }
});

const petSchema = new mongoose.Schema(
  {
    // Identity
    petId: {
      type: String,
      required: true,
      unique: true,
    },
    publicToken: {
      type: String,
      required: true,
      unique: true,
    },

    // Ownership
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Activation
    activationPinHash: {
      type: String,
      required: true,
    },
    activationStatus: {
      type: String,
      enum: ["UNACTIVATED", "ACTIVE", "DEACTIVATED"],
      default: "UNACTIVATED",
    },
    activationFailedAttempts: {
      type: Number,
      default: 0,
    },
    activationLockedUntil: {
      type: Date,
      default: null,
    },

    // Pet Information
    petName: { type: String, default: "" },
    species: { type: String, default: "" },
    breed: { type: String, default: "" },
    age: { type: String, default: "" },
    gender: { type: String, default: "" },
    photo: { type: String, default: "" },
    color: { type: String, default: "" },
    identificationMarks: { type: String, default: "" },

    // Contact Information
    contacts: [contactSchema],
    ownerName: { type: String, default: "" },

    // Location
    city: { type: String, default: "" },
    area: { type: String, default: "" },
    fullAddress: { type: String, default: "" },

    // Pet Status
    status: {
      type: String,
      enum: ["ACTIVE", "LOST", "FOUND"],
      default: "ACTIVE",
    },

    // Privacy Settings
    privacySettings: {
      showContacts: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
      // flexible privacy structure for future additions
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);
