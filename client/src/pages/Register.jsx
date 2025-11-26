import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";
import "./Auth.css";

export default function Register() {
  const nav = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [getNews, setGetNews] = useState(false);
  const [userType, setUserType] = useState("buyer");
  const [sellerProfile, setSellerProfile] = useState({
    shopName: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== passwordConfirm) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to Terms & Policies to continue!");
      return;
    }

    if (userType === "seller" && !sellerProfile.shopName) {
      setError("Shop name is required for seller registration!");
      return;
    }

    setBusy(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // Create Firebase account
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      // Register user in backend
      try {
        await registerUser({
          firebaseUid: cred.user.uid,
          email: cred.user.email,
          displayName: fullName,
          role: userType,
          sellerProfile:
            userType === "seller"
              ? {
                  ...sellerProfile,
                  phone: phone,
                }
              : undefined,
        });

        // Show success message based on user type
        if (userType === "seller") {
          alert(
            "Registration successful! Your seller application is pending admin approval. You'll be notified once approved."
          );
        }

        nav("/");
      } catch (regErr) {
        console.error("Registration error:", regErr);
        setError(
          regErr.response?.data?.message ||
            "Registration completed but backend registration failed. Please try logging in."
        );
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative background elements */}
      <div className="auth-bg-circle auth-bg-circle-1"></div>
      <div className="auth-bg-circle auth-bg-circle-2"></div>

      {/* Main card */}
      <div className="auth-card auth-card-register">
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
          <p className="auth-subtitle">Create your account to get started.</p>
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
          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">First Name</label>
              <input
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="First Name"
                required
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Last Name</label>
              <input
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Last Name"
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Phone</label>
            <input
              className="auth-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Phone Number"
              required
            />
          </div>

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

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password Confirmation</label>
              <div className="auth-input-wrapper">
                <input
                  className="auth-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                >
                  <i
                    className={`fas ${
                      showPasswordConfirm ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* User Type Selection */}
          <div className="auth-form-group">
            <label className="auth-label">I want to register as:</label>
            <div className="auth-radio-group">
              <div
                className={`auth-radio-item ${
                  userType === "buyer" ? "auth-radio-checked" : ""
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  id="buyer"
                  value="buyer"
                  checked={userType === "buyer"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <label htmlFor="buyer">
                  <strong>Buyer</strong>
                  <br />
                  <small>Browse and purchase products</small>
                </label>
              </div>
              <div
                className={`auth-radio-item ${
                  userType === "seller" ? "auth-radio-checked" : ""
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  id="seller"
                  value="seller"
                  checked={userType === "seller"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <label htmlFor="seller">
                  <strong>Seller</strong>
                  <br />
                  <small>Sell products (requires approval)</small>
                </label>
              </div>
            </div>
          </div>

          {/* Seller Profile Fields */}
          {userType === "seller" && (
            <div className="auth-seller-section">
              <div className="auth-form-group">
                <label className="auth-label">Shop Name *</label>
                <input
                  className="auth-input"
                  value={sellerProfile.shopName}
                  onChange={(e) =>
                    setSellerProfile({
                      ...sellerProfile,
                      shopName: e.target.value,
                    })
                  }
                  type="text"
                  placeholder="Enter your shop/business name"
                  required
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Shop Description</label>
                <textarea
                  className="auth-input auth-textarea"
                  value={sellerProfile.description}
                  onChange={(e) =>
                    setSellerProfile({
                      ...sellerProfile,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Brief description of your shop/business"
                />
              </div>
              <div className="auth-info-box">
                <i className="fas fa-info-circle me-2"></i>
                Your seller application will be reviewed by an admin. You'll be
                notified once approved.
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="auth-checkbox-group">
            <div className="auth-checkbox-item">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                required
              />
              <label htmlFor="agreeToTerms">
                Agree to{" "}
                <Link to="/terms" className="auth-link-inline">
                  Terms
                </Link>{" "}
                &{" "}
                <Link to="/policies" className="auth-link-inline">
                  Policies
                </Link>
              </label>
            </div>
            <div className="auth-checkbox-item">
              <input
                type="checkbox"
                id="getNews"
                checked={getNews}
                onChange={(e) => setGetNews(e.target.checked)}
              />
              <label htmlFor="getNews">Get news & offers by email</label>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={busy}>
            {busy ? "Creating Account..." : "Create Account"}
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

        {/* Link to login */}
        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
