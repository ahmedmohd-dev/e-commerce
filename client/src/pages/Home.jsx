import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold">Welcome to Our Store</h1>
              <p className="lead">Discover amazing products at great prices</p>
              <Link to="/products" className="btn btn-light btn-lg">
                Shop Now
              </Link>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <div
                  className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "200px", height: "200px" }}
                >
                  <i className="fas fa-shopping-cart fa-4x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container my-5">
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <i className="fas fa-shipping-fast fa-3x text-primary mb-3"></i>
                <h5>Fast Shipping</h5>
                <p className="text-muted">Free shipping on orders over $100</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <i className="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                <h5>Secure Payment</h5>
                <p className="text-muted">Safe and secure payment processing</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <i className="fas fa-headset fa-3x text-primary mb-3"></i>
                <h5>24/7 Support</h5>
                <p className="text-muted">Round-the-clock customer support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
