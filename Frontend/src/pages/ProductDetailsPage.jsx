import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/productDetails.css";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { getReviews, addReview } from "../services/reviewService";
import { FaStar } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";

import { showSuccess, showError } from "../utils/toast";

import { API_BASE } from "../config/api";
  
function ProductDetailsPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  const [quantity, setQuantity] = useState(1);

  const [selectedImage, setSelectedImage] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // const handleAddToWishlist = async () => {
  //   await addToWishlist(product._id);

  //   alert("Added to wishlist");
  // };

  const handleAddToWishlist = async () => {
  try{
    await addToWishlist(product._id);
    showSuccess("Added to wishlist ❤️");
  }catch{
    showError("Please login first");
  }
};

 const handleAddToCart = async () => {

  if (product.stock === 0) {
    showError("Product is out of stock");
    return;
  }

  if (quantity > product.stock) {
    showError(`Only ${product.stock} available in stock`);
    return;
  }

  try {
    await addToCart(product._id, quantity);

    showSuccess("Added to cart 🛒");

  } catch (error) {
    showError("Please login first");
  }
};

 
const handleBuyNow = () => {

  if (product.stock === 0) {
    showError("Product is out of stock");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {

    showError("Please login first"); // ❌ was success before

    setTimeout(() => {
      navigate("/login");
    }, 1000);

    return;
  }

  navigate(`/checkout?productId=${product._id}&qty=${quantity}`);

};


  useEffect(() => {
    const fetchProduct = async () => {
      const response = await axios.get(
  `${API_BASE}/api/products/${id}`
);
      setProduct(response.data);
      setSelectedImage(response.data.images?.[0]);
    };

    const fetchReviews = async () => {
      try {
       const response = await axios.get(
  `${API_BASE}/api/reviews/${id}`
);
        setReviews(response.data);
      } catch (error) {
        console.error("Review fetch error:", error);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  if (!product) return <p>Loading...</p>;

  return (
    

    <div className="product-details">
      {/* LEFT SIDE - GALLERY */}

      <div className="product-details-wrapper">

     <div className="product-left">

     <div className="product-gallery"> 

     <div className="thumbnail-row">
    {product.images.map((img, index) => (
      <img
        key={index}
        src={img}
        alt=""
        className={`thumbnail ${selectedImage === img ? "active-thumb" : ""}`}
        onClick={() => setSelectedImage(img)}
      />
    ))}
  </div>

  <div className="main-image-container">
    <img
      src={selectedImage}
      alt={product.name}
      className="main-image"
    />

      <button
    className="wishlist-icon"
    onClick={handleAddToWishlist}
  >
    <FaHeart />
  </button>
  </div>

 </div>

</div>

      {/* RIGHT SIDE - DETAILS */}
      <div className="product-info-section">
        <h2>{product.name}</h2>
         
         {/* ✅ SMALL DESCRIPTION */}
<p className="small-desc">
  {product.smallDescription}
</p>

        {/* ✅ PRICE SECTION */}
<div className="details-price">

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

        {/* <h3 className="details-price">₹{product.price}</h3> */}



        <p
          style={{
            color: product.stock > 0 ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
        </p>

       

        {/* Quantity */}
        <div className="qty-box">
          <button
            onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            onClick={() =>
              setQuantity((prev) => (prev < product.stock ? prev + 1 : prev))
            }
          >
            +
          </button>
        </div>

        <button
          disabled={product.stock === 0}
          onClick={handleAddToCart}
          className="btn btn-primary buy-btn"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>

            <button
  className="btn btn-primary buy-btn"
  onClick={handleBuyNow}
>
  Buy Now
</button>

              {/* ✅ BIG DESCRIPTION */}
<div className="big-description">
  <h3>Product Details</h3>
  <p>{product.description}</p>
</div>


             {/* <button
                className="btn btn-primary"
                onClick={() => window.location.href = "/checkout"}
              >
                Proceed to Checkout
              </button> */}

      </div>

    </div>


      <hr style={{ margin: "40px 0" }} />

      <h3>Customer Reviews</h3>

      {reviews.length === 0 && <p>No reviews yet</p>}

      {/* {reviews.map((review) => (

        <div key={review._id} className="review-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <strong>{review.user?.name}</strong>

            {review.isVerifiedPurchase && (
              <span
                style={{
                  background: "#4caf50",
                  color: "white",
                  padding: "2px 8px",
                  fontSize: "12px",
                  borderRadius: "5px",
                }}
              >
                Verified Purchase
              </span>
            )}
          </div>

          <div style={{ color: "gold", margin: "5px 0" }}>
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>

          <p>{review.comment}</p>
          {review.images && review.images.length > 0 && (
    <div style={{ marginTop: "10px" }}>
    <img
      src={`${API_BASE}${review.images[0]}`}
      alt="review"
      style={{
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #ddd"
      }}
    />
  </div>
)}

          

            {review.adminReply && (

  <div className="admin-reply">

    <strong>PetRonaq Reply:</strong>

    <p>{review.adminReply}</p>

  </div>

)}

          <small>{new Date(review.createdAt).toLocaleDateString()}</small>
        </div>
      ))} */}


          {reviews.map((review) => {

  console.log("Review images:", review.images); // 👈 ADD HERE

  return (

    <div key={review._id} className="review-card">

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <strong>{review.user?.name}</strong>

        {review.isVerifiedPurchase && (
          <span
            style={{
              background: "#4caf50",
              color: "white",
              padding: "2px 8px",
              fontSize: "12px",
              borderRadius: "5px",
            }}
          >
            Verified Purchase
          </span>
        )}
      </div>

      <div style={{ color: "gold", margin: "5px 0" }}>
        {"★".repeat(review.rating)}
        {"☆".repeat(5 - review.rating)}
      </div>

      <p>{review.comment}</p>

      {review.images && review.images.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <img
            src={`${API_BASE}${review.images[0]}`}
            alt="review"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}
          />
        </div>
      )}

      {review.adminReply && (
        <div className="admin-reply">
          <strong>PetRonaq Reply:</strong>
          <p>{review.adminReply}</p>
        </div>
      )}

      <small>{new Date(review.createdAt).toLocaleDateString()}</small>

    </div>

  );

})}


    </div>
  );
};
export default ProductDetailsPage;
