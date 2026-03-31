// import { Link } from "react-router-dom";
// import { addToCart } from "../services/cartService";
// import { addToWishlist } from "../services/wishlistService";
// import "../styles/productCard.css";

// function ProductCard({ product }) {

//   const handleCart = async (e) => {

//     e.preventDefault();

//     await addToCart(product._id, 1);

//     alert("Added to cart");

//   };

//   const handleWishlist = async (e) => {

//     e.preventDefault();

//     await addToWishlist(product._id);

//     alert("Added to wishlist");

//   };

//   return (
//     <div className="product-card">

//       <Link to={`/product/${product._id}`}>

//         <div className="image-container">

//           <img
//             src={product.images[0]}
//             alt={product.name}
//           />

//         </div>

//         <h3>{product.name}</h3>

//         <p className="price">
//           ₹{product.price}
//         </p>

//       </Link>

//       <div className="product-buttons">

//         <button
//           className="btn btn-primary"
//           onClick={handleCart}
//         >
//           Add to Cart
//         </button>

//         <button
//           className="btn btn-primary"
//           onClick={handleWishlist}
//         >
//           Wishlist
//         </button>

//       </div>

//     </div>
//   );

// }

// export default ProductCard;







import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { addToWishlist } from "../services/wishlistService";
import "../styles/productCard.css";
import { showSuccess, showError } from "../utils/toast";

function ProductCard({ product, onWishlist }) {

  // const handleCartClick = (e) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   onAddToCart(product._id);
  // };

  // const handleWishlistClick = (e) => {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   onWishlist(product._id);
  // };

//   const handleWishlistClick = () => {
//   if (onWishlist) {
//     onWishlist(product._id);
//   }
// };

  const handleWishlistClick = async (e) => {

  e.stopPropagation();
  e.preventDefault();

  try {

    if (onWishlist) {
      onWishlist(product._id);
    } else {
      await addToWishlist(product._id);
      showSuccess("Added to wishlist");
    }

  } catch (error) {

    console.error("Wishlist error:", error);
    showError("Failed to add to wishlist");    

  }

};

  return (

      <Link
    to={`/product/${product._id}`}
    className="product-card"
  >

    {/* IMAGE */}
    <div className="product-image-wrapper">

      <img
        src={product.images?.[0]}
        alt={product.name}
        className="product-image"
      />

      <button
        className="wishlist-btn"
        onClick={handleWishlistClick}
      >
        <FaHeart />
      </button>

    </div>

    {/* CONTENT */}
    
    <div className="product-content">

  {/* NAME */}
  <h3 className="product-name">
    {product.name}
     {/* {product.name.split(" ").slice(0, 2).join(" ")} */}
  </h3>

  {/* SMALL DESCRIPTION */}
  <p className="product-small-desc">
    {product.smallDescription}
  </p>

  {/* RATING */}
    {product.numReviews > 0 && (
  <div className="product-rating">
    {"★".repeat(Math.round(product.ratings))}
    {"☆".repeat(5 - Math.round(product.ratings))}

    <span className="review-count">
      {product.ratings.toFixed(1)} ({product.numReviews})
    </span>
  </div>
)}

  {/* PRICE */}
  <div className="price-row">

  {product.discountPrice > 0 ? (
    <>
      <span className="old-price">
        ₹{product.price}
      </span>

      <span className="new-price">
        ₹{product.discountPrice}
      </span>
    </>
  ) : (
    <span className="new-price">
      ₹{product.price}
    </span>
  )}

</div>

</div>

  </Link>

  );

}

export default ProductCard;