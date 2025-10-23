import React, { useEffect, useState } from "react";
import http from "../api/http";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";

export default function Products() {
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    http.get("/api/products").then((r) => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
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

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-5 fw-bold">Our Products</h1>
          <p className="text-muted">Discover our amazing collection</p>
        </div>
      </div>

      <div className="row">
        {data.items.map((p) => (
          <div key={p._id} className="col-6 col-md-4 col-lg-3 mb-4">
            <div className="card h-100 shadow-sm border-0 product-card">
              <div className="position-relative">
                <img
                  src={p.images?.[0]}
                  className="card-img-top"
                  alt={p.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="position-absolute top-0 end-0 m-2">
                  <span className="badge bg-success">In Stock</span>
                </div>
                <div className="position-absolute top-0 start-0 m-2">
                  <button
                    className={`btn btn-sm rounded-circle ${
                      isFavorite(p._id) ? "btn-danger" : "btn-outline-danger"
                    }`}
                    onClick={() => toggleFavorite(p)}
                    title={
                      isFavorite(p._id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <i className="fas fa-heart"></i>
                  </button>
                </div>
              </div>
              <div className="card-body d-flex flex-column">
                <h6 className="card-title fw-bold">{p.name}</h6>
                <p className="card-text text-muted small">{p.description}</p>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="h5 text-primary mb-0">${p.price}</span>
                    <div className="text-warning">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Link className="btn btn-primary" to={`/product/${p.slug}`}>
                      <i className="fas fa-eye me-1"></i>
                      View Details
                    </Link>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleAddToCart(p)}
                    >
                      <i className="fas fa-shopping-cart me-1"></i>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
