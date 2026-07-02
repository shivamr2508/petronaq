import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { addToWishlist } from "../services/wishlistService";
import { addToCart } from "../services/cartService";
import { showSuccess, showError } from "../utils/toast";
import "../styles/productCard.css";

function ProductCard({ product, onWishlist }) {
  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (onWishlist) {
        onWishlist(product._id);
      } else {
        await addToWishlist(product._id);
        showSuccess("Added to wishlist ❤️");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      showError("Failed to add to wishlist");
    }
  };

  const handleAddToCart = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const token = localStorage.getItem("token");

  if (!token) {
    showError("🔒 Please Login First");
    return;
  }

  try {
    await addToCart(product._id, 1);
    showSuccess("🛒 Added to cart");
  } catch (error) {
    showError("Failed to add to cart");
  }
};

  return (
    <Link
      to={`/products/${product.slug || product._id}`}
      className="product-card"
    >
      {/* IMAGE */}
      <div className="product-image-wrapper">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="product-image"
        />

        {product.discountPrice > 0 && (
          <div className="discount-badge">
            SALE
          </div>
        )}

        <button
          className="wishlist-btn"
          onClick={handleWishlistClick}
        >
          <FaHeart />
        </button>
      </div>

      {/* CONTENT */}
      <div className="product-content">
        <h3 className="product-name">
          {product.name}
        </h3>

        <p className="product-small-desc">
          {product.smallDescription}
        </p>

        {product.numReviews > 0 && (
          <div className="product-rating">
            {"★".repeat(Math.round(product.ratings))}
            {"☆".repeat(5 - Math.round(product.ratings))}

            <span className="review-count">
              {product.ratings.toFixed(1)} ({product.numReviews})
            </span>
          </div>
        )}

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

        <button
          className="add-cart-btn"
          onClick={handleAddToCart}
        >
          🛒 Add to Cart
        </button>
      </div>
    </Link>
  );
}

export default ProductCard;