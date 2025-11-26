import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative background elements */}
      <div className="auth-bg-circle auth-bg-circle-1"></div>
      <div className="auth-bg-circle auth-bg-circle-2"></div>

      {/* Main card */}
      <div className="auth-card">
        {/* Branding Header */}
        <div className="auth-header">
          <div className="auth-logo-text">
            <span className="auth-logo-letter" style={{ color: "#10b981" }}>
              W
            </span>
            <span className="auth-logo-letter" style={{ color: "#f59e0b" }}>
              e
            </span>
            <span className="auth-logo-letter" style={{ color: "#f97316" }}>
              l
            </span>
            <span className="auth-logo-letter" style={{ color: "#ec4899" }}>
              c
            </span>
            <span className="auth-logo-letter" style={{ color: "#8b5cf6" }}>
              o
            </span>
            <span className="auth-logo-letter" style={{ color: "#06b6d4" }}>
              m
            </span>
            <span className="auth-logo-letter" style={{ color: "#14b8a6" }}>
              e
            </span>
          </div>
          <div className="auth-icons">
            <div className="auth-icon-circle auth-icon-bag">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <div className="auth-icon-circle auth-icon-heart">
              <i className="far fa-heart"></i>
            </div>
          </div>
          <h1 className="auth-title">MegaMart</h1>
          <p className="auth-subtitle">Welcome! Please enter your account.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            Login
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <div className="auth-dev-badge">
            <span>Developed by Ahmed Mohammed</span>
          </div>
          <div className="auth-contact">
            <div className="auth-contact-item">
              <i className="fas fa-phone me-2"></i>
              <span>+251-913-36-7176</span>
            </div>
            <div className="auth-contact-item">
              <i className="fas fa-envelope me-2"></i>
              <span>megamart534@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Link to register */}
        <div className="auth-link">
          Don't have an account? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
