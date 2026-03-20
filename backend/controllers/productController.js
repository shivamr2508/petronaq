const Product = require("../models/Product");

// Create Product (Admin)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
       petTypes,
      categories,
      stock,
      images,
    } = req.body;

        // 🔒 STOCK VALIDATION
    const safeStock = Number(stock);

    if (isNaN(safeStock) || safeStock < 0) {
      return res.status(400).json({
        message: "Stock must be a positive number",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      petTypes,
      categories,
      stock: safeStock,
      images,
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// exports.getProducts = async (req, res) => {

//   try {

//     const keyword = req.query.keyword
//       ? {
//           name: {
//             $regex: req.query.keyword,
//             $options: "i",
//           },
//         }
//       : {};

//     const products = await Product.find(keyword);

//     res.json(products);

//   } catch (error) {

//     res.status(500).json({
//       message: error.message,
//     });

//   }

// };

exports.getProducts = async (req, res) => {

  try {

    const filter = {};

    // keyword search

    // if (req.query.keyword) {
    //   filter.name = {
    //     $regex: req.query.keyword,
    //     $options: "i",
    //   };
    // }

   if (req.query.keyword) {

  const words = req.query.keyword.split(" ");

  filter.$or = [];

  words.forEach(word => {
    filter.$or.push(
      { name: { $regex: word, $options: "i" } },
      { description: { $regex: word, $options: "i" } },
      { categories: { $regex: word, $options: "i" } },
      { petTypes: { $regex: word, $options: "i" } }
    );
  });

}

    // pet filter (array support)
    if (req.query.petType) {
      filter.petTypes = req.query.petType;
    }

    // category filter (array support)
    if (req.query.category) {
      filter.categories = req.query.category;
    }

    const products = await Product.find(filter);

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// Get Single Product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};




exports.updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      petTypes,
      categories,
      stock,
      images,
    } = req.body;

    if (stock !== undefined) {

      const safeStock = Number(stock);

      if (isNaN(safeStock) || safeStock < 0) {
        return res.status(400).json({
          message: "Stock must be a positive number",
        });
      }

      product.stock = safeStock;
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (categories !== undefined) product.categories = categories;
    if (petTypes !== undefined) product.petTypes = petTypes;
    if (images !== undefined) product.images = images;

    const updatedProduct = await product.save();

    res.json(updatedProduct);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};