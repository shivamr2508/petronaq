import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";

function ReviewButton({ productId, orderId, navigate }) {

  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {

    const checkReview = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${API_BASE}/api/reviews/check/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setReviewed(res.data.reviewed);

      } catch (error) {

        console.error(error);

      }

    };

    checkReview();

  }, [productId]);

  if (reviewed) {

    return (
      <button disabled className="btn">
        ✔ Review Submitted
      </button>
    );

  }

  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        navigate(`/review/${productId}/${orderId}`)
      }
    >
      Write Review
    </button>
  );

}

export default ReviewButton;