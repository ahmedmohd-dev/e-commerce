import React, { useEffect, useRef, useState } from "react";
import http from "../api/http";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import useAddToCartAnimation from "../hooks/useAddToCartAnimation";
import "../components/AddToCartAnimation.css";
import ProductReviews from "../components/ProductReviews";
import { getEffectivePrice, isSaleActive, formatETB } from "../utils/pricing";

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const triggerAddToCartAnimation = useAddToCartAnimation();
  const imageRef = useRef(null);

  const refreshProduct = () => {
    http.get("/api/products/" + slug).then((r) => {
      setP(r.data);
    });
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return Array.from({ length: 5 }, (_, i) => {
      if (i < fullStars) {
        return <i key={i} className="fas fa-star text-warning"></i>;
      } else if (i === fullStars && hasHalfStar) {
        return <i key={i} className="fas fa-star-half-alt text-warning"></i>;
      } else {
        return <i key={i} className="far fa-star text-muted"></i>;
      }
    });
  };

  useEffect(() => {
    http.get("/api/products/" + slug).then((r) => {
      setP(r.data);
      setLoading(false);
    });
  }, [slug]);

  const handleAddToCart = () => {
    addToCart(p, quantity);
    if (imageRef.current) {
      triggerAddToCartAnimation(imageRef.current);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!p)
    return (
      <div className="container mt-5">
        <h2>Product not found</h2>
      </div>
    );

  const saleActive = isSaleActive(p);
  const finalPrice = getEffectivePrice(p);
  const discountPercent =
    saleActive && p.sale?.discountPercent
      ? p.sale.discountPercent
      : saleActive && p.price
      ? Math.round(((p.price - finalPrice) / p.price) * 100)
      : 0;

  return (
    <div className="container mt-4">
      <button
        type="button"
        className="btn btn-light btn-sm mb-3"
        onClick={() => navigate(-1)}
      >
        <i className="fas fa-arrow-left me-1"></i>
        Back
      </button>
      <div className="row">
        <div className="col-md-6">
          <div className="position-relative">
            <img
              ref={imageRef}
              src={p.images?.[0]}
              className="img-fluid rounded shadow"
              alt={p.name}
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
            <div className="position-absolute top-0 end-0 m-3">
              {saleActive && (
                <span className="badge bg-warning text-dark me-2">
                  {p.sale?.badgeText || "Limited Deal"}
                </span>
              )}
              <span className="badge bg-success fs-6">In Stock</span>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="ps-md-4">
            <h1 className="display-6 fw-bold mb-3">{p.name}</h1>
            <div className="mb-3">
              <div className="mb-2">
                {renderStars(p.rating || 0)}
                <span className="text-muted ms-2">
                  {p.rating ? `${p.rating.toFixed(1)}/5` : "No ratings yet"} (
                  {p.numReviews || 0}{" "}
                  {p.numReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
            <p className="lead text-muted mb-4">{p.description}</p>

            <div className="mb-4 d-flex flex-wrap align-items-center gap-3">
              {saleActive && (
                <span className="fs-4 text-muted text-decoration-line-through">
                  {formatETB(p.price)}
                </span>
              )}
              <span className="display-5 fw-bold text-primary">
                {formatETB(finalPrice)}
              </span>
              {saleActive && discountPercent > 0 && (
                <span className="badge bg-danger fw-semibold">
                  -{discountPercent}%
                </span>
              )}
              <span className="text-muted">Free shipping</span>
            </div>

            <div className="row mb-4">
              <div className="col-6">
                <label className="form-label fw-bold">Quantity</label>
                <div className="input-group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="d-grid gap-2 d-md-flex">
              <button
                className={`btn btn-lg flex-fill ${
                  addedToCart ? "btn-success" : "btn-primary"
                }`}
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                <i
                  className={`fas ${
                    addedToCart ? "fa-check" : "fa-shopping-cart"
                  } me-2`}
                ></i>
                {addedToCart ? "Added to Cart!" : "Add to Cart"}
              </button>
              <button
                className={`btn btn-lg ${
                  isFavorite(p?._id) ? "btn-danger" : "btn-outline-primary"
                }`}
                onClick={(e) => {
                  if (p) {
                    const wasFavorite = isFavorite(p._id);
                    toggleFavorite(p);
                    if (!wasFavorite) {
                      const card = e.currentTarget
                        .closest(".container")
                        ?.querySelector("img.img-fluid.rounded.shadow");
                      const imgEl = card || imageRef.current;
                      if (imgEl) {
                        triggerAddToCartAnimation(imgEl, {
                          targetSelector: ".mega-favorites-icon",
                          mobileTargetSelector: ".mega-mobile-favorites-icon",
                          pulseClass: "favorites-icon-pulse",
                        });
                      }
                    }
                  }
                }}
              >
                <i
                  className={`fas ${
                    isFavorite(p?._id) ? "fa-heart" : "fa-heart"
                  }`}
                ></i>
              </button>
            </div>

            <div className="mt-4">
              <div className="row text-center">
                <div className="col-4">
                  <i className="fas fa-shipping-fast fa-2x text-primary mb-2"></i>
                  <p className="small mb-0">Free Shipping</p>
                </div>
                <div className="col-4">
                  <i className="fas fa-undo fa-2x text-primary mb-2"></i>
                  <p className="small mb-0">Easy Returns</p>
                </div>
                <div className="col-4">
                  <i className="fas fa-shield-alt fa-2x text-primary mb-2"></i>
                  <p className="small mb-0">Secure Payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="row mt-5">
        <div className="col-12">
          <ProductReviews productId={p._id} onRatingUpdate={refreshProduct} />
        </div>
      </div>
    </div>
  );
}
