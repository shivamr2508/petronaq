import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import ProductCard from "./ProductCard";

function ProductGrid() {

  const [products, setProducts] = useState([]);

  useEffect(() => {

    const fetchProducts = async () => {
      const data = await getProducts();
      setProducts(data);
    };

    fetchProducts();

  }, []);

  return (

    <div className="products-grid">

      {products.map(product => (

        <ProductCard
          key={product._id}
          product={product}
        />

      ))}

    </div>

  );

}

export default ProductGrid;