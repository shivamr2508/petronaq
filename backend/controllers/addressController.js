const Address = require("../models/Address");

// GET addresses
exports.getAddresses = async (req, res) => {

  try {

    const addresses = await Address.find({
      user: req.user._id
    });

    res.json(addresses);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// ADD address

exports.addAddress = async (req, res) => {

  try {

    console.log("Backend received:", req.body);

    const address = new Address({

      user: req.user._id,

      fullName: req.body.fullName,

      phone: req.body.phone,

      addressLine: req.body.addressLine,

      city: req.body.city,

      state: req.body.state,

      postalCode: req.body.postalCode,

      // ✅ ADD THESE TWO
      lat: req.body.lat,
      lng: req.body.lng

    });

    await address.save();

    res.status(201).json(address);

  } catch (error) {

    console.error("Address save error:", error);

    res.status(500).json({
      message: error.message
    });

  }

};

// DELETE address

exports.deleteAddress = async (req, res) => {

  try {

    await Address.findByIdAndDelete(req.params.id);

    res.json({
      message: "Address deleted"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};