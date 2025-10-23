import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";

export default function Favorites() {
  const { items, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-heart fa-4x text-muted mb-4"></i>
                <h3 className="text-muted">No favorites yet</h3>
                <p className="text-muted mb-4">
                  Start adding products to your favorites by clicking the heart
                  icon.
                </p>
                <Link to="/products" className="btn btn-primary btn-lg">
                  <i className="fas fa-shopping-bag me-2"></i>
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-6 fw-bold">My Favorites</h1>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={clearFavorites}
            >
              <i className="fas fa-trash me-1"></i>
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {items.map((product) => (
          <div key={product._id} className="col-6 col-md-4 col-lg-3 mb-4">
            <div className="card h-100 shadow-sm border-0 product-card">
              <div className="position-relative">
                <img
                  src={product.images?.[0]}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="position-absolute top-0 end-0 m-2">
                  <button
                    className="btn btn-danger btn-sm rounded-circle"
                    onClick={() => removeFromFavorites(product._id)}
                    title="Remove from favorites"
                  >
                    <i className="fas fa-heart"></i>
                  </button>
                </div>
                <div className="position-absolute top-0 start-0 m-2">
                  <span className="badge bg-success">In Stock</span>
                </div>
              </div>
              <div className="card-body d-flex flex-column">
                <h6 className="card-title fw-bold">{product.name}</h6>
                <p className="card-text text-muted small">
                  {product.description}
                </p>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="h5 text-primary mb-0">
                      ${product.price}
                    </span>
                    <div className="text-warning">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Link
                      className="btn btn-primary"
                      to={`/product/${product.slug}`}
                    >
                      <i className="fas fa-eye me-1"></i>
                      View Details
                    </Link>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => addToCart(product, 1)}
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


