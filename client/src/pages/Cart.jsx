import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
                <h3 className="text-muted">Your cart is empty</h3>
                <p className="text-muted mb-4">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Link to="/products" className="btn btn-primary btn-lg">
                  <i className="fas fa-shopping-bag me-2"></i>
                  Start Shopping
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
            <h1 className="display-6 fw-bold">Shopping Cart</h1>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={clearCart}
            >
              <i className="fas fa-trash me-1"></i>
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {items.map((item) => (
                <div key={item.product._id} className="border-bottom p-4">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        className="img-fluid rounded"
                        style={{ height: "80px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="col-md-4">
                      <h6 className="fw-bold mb-1">{item.product.name}</h6>
                      <p className="text-muted small mb-0">
                        {item.product.description}
                      </p>
                    </div>
                    <div className="col-md-2">
                      <span className="h6 text-primary">
                        ${item.product.price}
                      </span>
                    </div>
                    <div className="col-md-2">
                      <div className="input-group input-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.product._id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity + 1)
                          }
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h6 mb-0">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          className="btn btn-outline-danger btn-sm ms-2"
                          onClick={() => removeFromCart(item.product._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-4">Order Summary</h5>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal ({items.length} items)</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">Free</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Tax</span>
                <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <span className="h5 fw-bold">Total</span>
                <span className="h5 fw-bold text-primary">
                  ${(getTotalPrice() * 1.1).toFixed(2)}
                </span>
              </div>

              <div className="d-grid gap-2">
                <Link to="/checkout" className="btn btn-primary btn-lg">
                  <i className="fas fa-credit-card me-2"></i>
                  Proceed to Checkout
                </Link>
                <Link to="/products" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-left me-2"></i>
                  Continue Shopping
                </Link>
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
    </div>
  );
}


