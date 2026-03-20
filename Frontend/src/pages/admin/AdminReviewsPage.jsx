import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/adminReviews.css";

function AdminReviewsPage() {

  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/reviews/admin/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReviews(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {

    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/reviews/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    fetchReviews();
  };

  const handleReply = async (id, reply) => {

    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/reviews/reply/${id}`,
      { reply },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    fetchReviews();
  };

  return (
    <div className="container">

      <h2>Manage Reviews</h2>

      {reviews.map((review) => (

        <div key={review._id} className="admin-review-card">

          <h3>{review.product?.name}</h3>

          <p><strong>User:</strong> {review.user?.name}</p>

          <p><strong>Rating:</strong> {review.rating} ⭐</p>

          <p>{review.comment}</p>

          {review.adminReply && (
            <div className="admin-reply">
              <strong>Admin Reply:</strong>
              <p>{review.adminReply}</p>
            </div>
          )}

          {!review.adminReply && (
            <input
              type="text"
              placeholder="Write reply..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleReply(review._id, e.target.value);
                }
              }}
            />
          )}

          <button
            className="btn btn-danger"
            onClick={() => handleDelete(review._id)}
          >
            Delete Review
          </button>

        </div>

      ))}

    </div>
  );
}

export default AdminReviewsPage;