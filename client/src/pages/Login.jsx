import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import "./Auth.css";

export default function Login() {
  const nav = useNavigate();
  const { t } = useLanguage();
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
            <span className="auth-logo-wordmark">Welcome</span>
          </div>
          <div className="auth-logo-container">
            <img
              src="https://i.postimg.cc/TPzxSc0Q/login.png"
              alt="MegaMart Logo"
              className="auth-logo-img"
            />
          </div>
          <p className="auth-subtitle">{t("auth.welcomeSubtitle")}</p>
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
            <label className="auth-label">{t("auth.email")}</label>
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder={t("auth.email")}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">{t("auth.password")}</label>
            <div className="auth-input-wrapper">
              <input
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.password")}
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
            {t("auth.signInTitle")}
          </button>

          {/* Link to register */}
          <div className="auth-link">
            {t("auth.dontHaveAccount")}{" "}
            <Link to="/register">{t("auth.signUpHere")}</Link>
          </div>
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
      </div>
    </div>
  );
}
