import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import "../styles/reviews.css";

// ✅ toast helpers
import { showError, showLoading, updateSuccess, updateError } from "../utils/toast";

function ReviewPage() {

  const { productId, orderId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {

    // 🔥 Validation (toast instead of alert)
    if (rating === 0) {
      showError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      showError("Please write a review");
      return;
    }

    const t = showLoading("Submitting review...");

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `/api/reviews/${productId}`,
        {
          rating,
          comment,
          orderId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // ✅ success
      updateSuccess("Review submitted successfully", t);

      setTimeout(()=>{
        navigate("/orders");
      }, 800);

    } catch (error) {

      // ❌ error
      updateError(
        error.response?.data?.message || "Failed to submit review",
        t
      );

    } finally {
      setLoading(false);
    }

  };


  return (

    <div className="container">

      <h2>Write Review</h2>

      <div className="star-select" style={{ marginBottom: "15px" }}>

        {[1,2,3,4,5].map((star) => (

          <FaStar
            key={star}
            size={28}
            style={{ cursor: "pointer", marginRight: "5px" }}
            color={star <= rating ? "gold" : "#ccc"}
            onClick={() => setRating(star)}
          />

        ))}

      </div>

      <textarea
        placeholder="Write your review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          width: "100%",
          height: "120px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "15px"
        }}
      />

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>

    </div>

  );

}

export default ReviewPage;