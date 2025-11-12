import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../api/reviewApi";

export default function ProductReviews({ productId, onRatingUpdate }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to leave a review");
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        await updateReview(editingReview._id, { rating, comment });
      } else {
        await createReview(productId, { rating, comment });
      }
      await loadReviews();
      if (onRatingUpdate) onRatingUpdate();
      setShowForm(false);
      setEditingReview(null);
      setRating(5);
      setComment("");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReview(reviewId);
      await loadReviews();
      if (onRatingUpdate) onRatingUpdate();
    } catch (error) {
      alert("Failed to delete review");
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);
    setShowForm(true);
  };

  const userReview = reviews.find((r) => r.user?.email === user?.email);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? "text-warning" : "text-muted"}`}
      ></i>
    ));
  };

  return (
    <div className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="fas fa-star me-2"></i>Reviews ({reviews.length})
        </h4>
        {user && !userReview && (
          <button
            className="btn btn-orange"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="fas fa-plus me-2"></i>Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-3">
              {editingReview ? "Edit Review" : "Write a Review"}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Rating</label>
                <div>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="btn btn-link p-0 me-2"
                      onClick={() => setRating(r)}
                    >
                      <i
                        className={`fas fa-star fa-2x ${
                          r <= rating ? "text-warning" : "text-muted"
                        }`}
                      ></i>
                    </button>
                  ))}
                  <span className="ms-2 text-muted">{rating}/5</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-orange"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReview(null);
                    setRating(5);
                    setComment("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-star fa-3x text-muted mb-3"></i>
          <p className="text-muted">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="list-group">
          {reviews.map((review) => (
            <div key={review._id} className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="d-flex align-items-center mb-1">
                      <strong className="me-2">
                        {review.user?.email?.split("@")[0] || "Anonymous"}
                      </strong>
                      {review.isVerified && (
                        <span
                          className="badge bg-success me-2"
                          title="Verified Purchase"
                        >
                          <i className="fas fa-check-circle me-1"></i>Verified
                          Purchase
                        </span>
                      )}
                      <div className="text-warning">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <small className="text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt !== review.createdAt && " (edited)"}
                    </small>
                  </div>
                  {user && review.user?.email === user.email && (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(review)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(review._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
                <p className="mb-0">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
