import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
// import "../styles/home.css";
import "../styles/productsPage.css";

function ProductsPage() {

  const [products, setProducts] = useState([]);
//   const [petType, setPetType] = useState("");
// const [category, setCategory] = useState("");

const location = useLocation();
  const navigate = useNavigate();

const params = new URLSearchParams(location.search);

const keyword = params.get("keyword") || "";
const petType = params.get("petType") || "";
const category = params.get("category") || "";

  useEffect(() => {

    const fetchProducts = async () => {
      const data = await getProducts(keyword, petType, category);
      setProducts(data);
    };

    fetchProducts();

  }, [location.search]);

  const handleAddToCart = (productId) => {

    console.log("Add to cart:", productId);

  };

  const handleWishlist = (productId) => {

    console.log("Wishlist:", productId);

  };

  return (

   <div className="products-page">

    {/* FILTER SECTION */}
    
    <div className="filters-section">

    <h3 className="filter-title">Filter Products</h3>

    <div className="filters">

      <select
          value={petType}
          onChange={(e) => {
            const newParams = new URLSearchParams(location.search);
            newParams.set("petType", e.target.value);
            navigate(`/products?${newParams.toString()}`);
          }}
        >
        <option value="">All Pets</option>
        <option value="Dog">Dog</option>
        <option value="Cat">Cat</option>
        <option value="Fish">Fish</option>
        <option value="Bird">Bird</option>
      </select>

        <select
          value={category}
          onChange={(e) => {
            const newParams = new URLSearchParams(location.search);
            newParams.set("category", e.target.value);
            navigate(`/products?${newParams.toString()}`);
          }}
        >
        <option value="">All Categories</option>
        <option value="Food">Food</option>
        <option value="Toys">Toys</option>
        <option value="Accessories">Accessories</option>
        <option value="Grooming">Grooming</option>
        <option value="Beds">Beds</option>
        <option value="Health">Health</option>
      </select>

      </div>

    </div>


    {/* PRODUCTS GRID */}
    <div className="products-grid">

      {products.map(product => (

        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={handleAddToCart}
          onWishlist={handleWishlist}
        />

      ))}

    </div>

  </div>
    

  );

}

export default ProductsPage;