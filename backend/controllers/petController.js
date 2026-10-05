const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const Pet = require("../models/Pet");

/**
 * Generate a sequential Pet ID (e.g., PRN-000001)
 */
const generatePetId = async () => {
  let isUnique = false;
  let newPetId = "";
  
  // To avoid race conditions in generation, we can loop until we find a unique one
  while (!isUnique) {
    // Find the pet with the highest petId
    const lastPet = await Pet.findOne({}, "petId").sort({ createdAt: -1 });
    
    let nextNum = 1;
    if (lastPet && lastPet.petId && lastPet.petId.startsWith("PRN-")) {
      const lastNum = parseInt(lastPet.petId.split("-")[1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    
    // Format to 6 digits, e.g., PRN-000001
    newPetId = `PRN-${String(nextNum).padStart(6, "0")}`;
    
    const existing = await Pet.findOne({ petId: newPetId });
    if (!existing) {
      isUnique = true;
    } else {
      // If by some race condition it exists, we generate a random fallback or just retry? 
      // Actually since it's an admin route, collisions are rare, but let's just use a random suffix if collision happens after sorting to prevent infinite loops.
      // Wait, if it exists, the next iteration will just try again, but since lastPet is fetched outside the loop...
      // Better way: get count + 1 and try, if fails, retry with random or count+2.
      // We will do simple generation here with a fallback:
      const randomSuffix = crypto.randomInt(100, 999);
      newPetId = `PRN-${String(nextNum).padStart(6, "0")}-${randomSuffix}`;
      isUnique = true; // guarantee exit
    }
  }
  
  return newPetId;
};

/**
 * @desc    Generate a new Pet ID (Admin)
 * @route   POST /api/pets/admin/generate
 * @access  Private/Admin
 */
const generatePet = async (req, res) => {
  try {
    // 1. Generate unique Pet ID
    const petId = await generatePetId();

    // 2. Generate secure random publicToken
    // crypto.randomBytes(16) gives 32 hex characters - secure and unpredictable
    let publicToken;
    let tokenUnique = false;
    while (!tokenUnique) {
      publicToken = crypto.randomBytes(16).toString("hex");
      const existing = await Pet.findOne({ publicToken });
      if (!existing) tokenUnique = true;
    }

    // 3. Generate 6-digit activation PIN
    const plainPin = crypto.randomInt(100000, 999999).toString();

    // 4. Hash the PIN using bcrypt
    const salt = await bcrypt.genSalt(10);
    const activationPinHash = await bcrypt.hash(plainPin, salt);

    // 5. Create the Pet document
    const pet = new Pet({
      petId,
      publicToken,
      activationPinHash,
      activationStatus: "UNACTIVATED",
      status: "ACTIVE",
      ownerId: null,
    });

    await pet.save();

    // 6. Generate QR code using the public URL
    // Use env variable for base URL or fallback to https://petronaq.in
    const baseUrl = process.env.FRONTEND_URL || "https://petronaq.in";
    const qrUrl = `${baseUrl}/p/${publicToken}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    // 7. Return the necessary admin result
    res.status(201).json({
      success: true,
      message: "Pet ID generated successfully",
      data: {
        petId: pet.petId,
        publicToken: pet.publicToken, // useful for admin UI if needed
        qrCode,
        activationPin: plainPin, // ONE TIME ONLY return
        activationStatus: pet.activationStatus,
      },
    });
  } catch (error) {
    console.error("Error generating Pet ID:", error);
    res.status(500).json({ success: false, message: "Server error generating Pet ID" });
  }
};

/**
 * @desc    Get public pet profile by token
 * @route   GET /api/pets/public/:token
 * @access  Public
 */
const getPublicPetProfile = async (req, res) => {
  try {
    const { token } = req.params;

    // Fetch the pet by publicToken
    // Explicitly exclude sensitive fields (even though we map it later to be safe)
    const pet = await Pet.findOne({ publicToken: token }).select(
      "-activationPinHash -ownerId -_id"
    );

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    // If unactivated, return safe state
    if (pet.activationStatus === "UNACTIVATED") {
      return res.json({
        success: true,
        data: {
          status: "unactivated",
        },
      });
    }

    // Build the public safe response
    const safeResponse = {
      petName: pet.petName,
      breed: pet.breed,
      photo: pet.photo,
      status: pet.status,
      ownerName: pet.ownerName,
      fullAddress: pet.fullAddress
    };

    // Only include contacts if privacy settings allow
    if (pet.privacySettings && pet.privacySettings.showContacts) {
      // Filter only contacts marked as isPublic
      safeResponse.contacts = pet.contacts
        .filter((c) => c.isPublic)
        .map((c) => ({
          name: c.name,
          phone: c.phone,
          whatsapp: c.whatsapp,
          type: c.type,
        }));
    }

    res.json({
      success: true,
      data: safeResponse,
    });
  } catch (error) {
    console.error("Error fetching public pet profile:", error);
    res.status(500).json({ success: false, message: "Server error fetching pet profile" });
  }
};

/**
 * @desc    Activate a Pet ID
 * @route   POST /api/pets/activate
 * @access  Private
 */
const activatePet = async (req, res) => {
  try {
    let { 
      petId, 
      activationPin,
      petName,
      breed,
      photo,
      ownerName,
      primaryPhone,
      phone2,
      phone3,
      fullAddress 
    } = req.body;

    // 1. Input Validation & Sanitization
    if (!petId || !activationPin || !petName || !breed || !ownerName || !primaryPhone || !fullAddress) {
      return res.status(400).json({ success: false, message: "Activation failed. Please check all required fields, including Pet ID and PIN." });
    }

    petId = String(petId).trim();
    activationPin = String(activationPin).trim();

    const petIdRegex = /^PRN-\d+$/;
    const pinRegex = /^\d{6}$/;

    if (!petIdRegex.test(petId) || !pinRegex.test(activationPin)) {
      return res.status(400).json({ success: false, message: "Activation failed. Please check your Pet ID and PIN." });
    }

    // 2. Find the Pet
    const pet = await Pet.findOne({ petId });
    if (!pet) {
      return res.status(400).json({ success: false, message: "Activation failed. Please check your Pet ID and PIN." });
    }

    // 3. Check if already active
    if (pet.activationStatus === "ACTIVE" || pet.ownerId) {
      return res.status(400).json({ success: false, message: "This Pet ID is already activated" });
    }

    // 4. Pet-level brute force protection check
    if (pet.activationLockedUntil && pet.activationLockedUntil > new Date()) {
      return res.status(400).json({ success: false, message: "Activation failed. Please check your Pet ID and PIN." });
    }

    // 5. Verify PIN
    const isMatch = await bcrypt.compare(activationPin, pet.activationPinHash);
    
    if (!isMatch) {
      // Increment failed attempts
      pet.activationFailedAttempts = (pet.activationFailedAttempts || 0) + 1;
      
      // Lock if 5 or more attempts
      if (pet.activationFailedAttempts >= 5) {
        pet.activationLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }
      
      await pet.save();
      
      return res.status(400).json({ success: false, message: "Activation failed. Please check your Pet ID and PIN." });
    }

    // 6. Build Contacts Array
    const contacts = [{
      name: ownerName,
      phone: primaryPhone,
      type: "primary",
      isPrimary: true,
      isPublic: true
    }];
    if (phone2) {
      contacts.push({ name: ownerName, phone: phone2, type: "secondary", isPrimary: false, isPublic: true });
    }
    if (phone3) {
      contacts.push({ name: ownerName, phone: phone3, type: "other", isPrimary: false, isPublic: true });
    }

    // 7. Atomic update to claim ownership and save profile
    const updatedPet = await Pet.findOneAndUpdate(
      { 
        _id: pet._id, 
        activationStatus: "UNACTIVATED",
        ownerId: null
      },
      {
        $set: {
          ownerId: req.user._id,
          activationStatus: "ACTIVE",
          activationFailedAttempts: 0,
          activationLockedUntil: null,
          petName: petName.trim(),
          breed: breed.trim(),
          photo: photo ? photo.trim() : "",
          ownerName: ownerName.trim(),
          fullAddress: fullAddress.trim(),
          contacts: contacts
        }
      },
      { new: true }
    );

    if (!updatedPet) {
      return res.status(400).json({ success: false, message: "This Pet ID was just activated by another user" });
    }

    // 7. Return safe response
    res.status(200).json({
      success: true,
      message: "Pet successfully activated",
      data: {
        petId: updatedPet.petId,
        activationStatus: updatedPet.activationStatus,
        publicToken: updatedPet.publicToken
      }
    });

  } catch (error) {
    console.error("Error activating Pet ID:", error);
    // Generic error to not expose internal details
    res.status(500).json({ success: false, message: "Server error during activation" });
  }
};

module.exports = {
  generatePet,
  getPublicPetProfile,
  activatePet,
};
