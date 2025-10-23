import React, { useEffect, useState } from "react";
import http from "../api/http";
import { useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";

export default function ProductDetails() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    http.get("/api/products/" + slug).then((r) => {
      setP(r.data);
      setLoading(false);
    });
  }, [slug]);

  const handleAddToCart = () => {
    addToCart(p, quantity);
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

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6">
          <div className="position-relative">
            <img
              src={p.images?.[0]}
              className="img-fluid rounded shadow"
              alt={p.name}
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
            <div className="position-absolute top-0 end-0 m-3">
              <span className="badge bg-success fs-6">In Stock</span>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="ps-md-4">
            <h1 className="display-6 fw-bold mb-3">{p.name}</h1>
            <div className="mb-3">
              <div className="text-warning mb-2">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <span className="text-muted ms-2">(4.5/5)</span>
              </div>
            </div>
            <p className="lead text-muted mb-4">{p.description}</p>

            <div className="mb-4">
              <span className="display-4 fw-bold text-primary">${p.price}</span>
              <span className="text-muted ms-2">Free shipping</span>
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
                onClick={() => p && toggleFavorite(p)}
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
    </div>
  );
}
