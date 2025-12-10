import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { useLanguage } from "../contexts/LanguageContext";
import SuccessToast from "../components/SuccessToast";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import "./Auth.css";

export default function Register() {
  const nav = useNavigate();
  const { t } = useLanguage();
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
    tradeLicense: "",
  });
  const [tradeLicenseFile, setTradeLicenseFile] = useState(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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

    if (userType === "seller" && !sellerProfile.tradeLicense) {
      setError("Trade license is required for seller registration!");
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
        const response = await registerUser({
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

        // Show success toast notification
        setShowSuccessToast(true);

        // Auto-navigate to home page after a brief delay (user is already logged in via Firebase)
        setTimeout(() => {
          nav("/");
        }, 1500);
      } catch (regErr) {
        console.error("Registration error:", regErr);
        const errorMessage =
          regErr.response?.data?.message || "Registration failed";
        setError(errorMessage);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleTradeLicenseUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF or image)
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or image file (JPG, PNG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploadingLicense(true);
    setError("");
    try {
      const url = await uploadImageToCloudinary(file);
      setSellerProfile({
        ...sellerProfile,
        tradeLicense: url,
      });
      setTradeLicenseFile(file);
    } catch (err) {
      setError("Failed to upload trade license. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploadingLicense(false);
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
            <span className="auth-logo-wordmark">Welcome</span>
          </div>
          <div className="auth-logo-container">
            <img
              src="https://i.postimg.cc/TPzxSc0Q/login.png"
              alt="MegaMart Logo"
              className="auth-logo-img"
            />
          </div>
          <p className="auth-subtitle">{t("auth.signUpTitle")}</p>
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
              <label className="auth-label">{t("auth.firstName")}</label>
              <input
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder={t("auth.firstName")}
                required
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">{t("auth.lastName")}</label>
              <input
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder={t("auth.lastName")}
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">{t("auth.phone")}</label>
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
            <label className="auth-label">{t("auth.email")}</label>
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
              <label className="auth-label">{t("auth.password")}</label>
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
              <label className="auth-label">{t("auth.confirmPassword")}</label>
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
                  <strong>{t("auth.buyer")}</strong>
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
                  <strong>{t("auth.seller")}</strong>
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
              <div className="auth-form-group">
                <label className="auth-label">
                  Trade License <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="auth-input"
                  onChange={handleTradeLicenseUpload}
                  disabled={uploadingLicense}
                  required
                />
                {uploadingLicense && (
                  <small
                    className="text-muted"
                    style={{ display: "block", marginTop: "4px" }}
                  >
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Uploading...
                  </small>
                )}
                {sellerProfile.tradeLicense && !uploadingLicense && (
                  <small
                    className="text-success"
                    style={{ display: "block", marginTop: "4px" }}
                  >
                    <i className="fas fa-check-circle me-1"></i>
                    Trade license uploaded successfully
                  </small>
                )}
                <small
                  className="text-muted"
                  style={{ display: "block", marginTop: "4px" }}
                >
                  Upload a PDF or image file (JPG, PNG). Max size: 5MB
                </small>
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
            <span>
              {t("auth.developer")} {t("auth.by")} Ahmed Mohammed
            </span>
          </div>
          <div className="auth-contact">
            <div className="auth-contact-item">
              <i className="fas fa-phone me-2"></i>
              <span>+251-913-36-7176</span>
            </div>
            <div className="auth-contact-item">
              <i className="fas fa-envelope me-2"></i>
              <span>ahmedmohammedkiar2@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Link to login */}
        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>

      {/* Success Toast */}
      <SuccessToast
        show={showSuccessToast}
        message={
          userType === "seller"
            ? "Registration successful! Your seller application is pending admin approval."
            : "Registered successfully! Welcome to MegaMart!"
        }
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  );
}
