import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import "../styles/wishlist.css";

// ✅ toast helpers
import { showSuccess, showError, showLoading, updateError, dismissToast } from "../utils/toast";

function WishlistPage() {

  const [wishlist, setWishlist] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {

    const t = showLoading("Loading wishlist...");

    try{
      const data = await getWishlist();
      setWishlist(data);

      // remove loading toast
       dismissToast(t); // silently remove (hacky but works)

    }catch{
      updateError("Failed to load wishlist", t);
    }

  };

  const handleRemove = async (productId) => {

    try{
      await removeFromWishlist(productId);

      showSuccess("Removed from wishlist");

      fetchWishlist();

    }catch{
      showError("Failed to remove item");
    }

  };

 if (!wishlist){
  return (
    <div className="wishlist-container">
      <p className="wishlist-loading">Loading your wishlist...</p>
    </div>
  );
}

if (wishlist.products.length === 0){
  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">Your Wishlist</h2>
      <p className="wishlist-empty">Your wishlist is empty 🐾</p>
    </div>
  );
}

  
  return (
    <div className="wishlist-container">

      <h2 className="wishlist-title">Your Wishlist</h2>
  

      {wishlist.products.map((product) => (

        <div key={product._id} className="wishlist-card">

          <img
            src={product.images[0]}
            className="wishlist-image"
            onClick={() => navigate(`/product/${product._id}`)}
          />

          <div
            className="wishlist-info"
            onClick={() => navigate(`/product/${product._id}`)}
          >

            <h3 className="product-name">{product.name}</h3>

            <p className="product-price">₹{product.price}</p>

          </div>

          <button
            className="remove-btn"
            onClick={() => handleRemove(product._id)}
          >
            Remove
          </button>

        </div>

      ))}

    </div>
  );

}

export default WishlistPage;