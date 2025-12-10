import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export default function NewsletterSignup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    // TODO: Integrate with newsletter API
    console.log("Newsletter signup:", email);
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <section className="newsletter-section py-5 bg-primary text-white">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h3 className="fw-bold mb-2">
              <i className="fas fa-envelope me-2"></i>
              Subscribe to Our Newsletter
            </h3>
            <p className="mb-0 opacity-90">
              Get the latest offers, updates, and exclusive deals delivered to
              your inbox.
            </p>
          </div>
          <div className="col-lg-6">
            <form onSubmit={handleSubmit} className="newsletter-form">
              <div className="input-group input-group-lg">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn btn-warning" type="submit">
                  Subscribe
                </button>
              </div>
              {status === "success" && (
                <div className="alert alert-success mt-3 mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  Thank you for subscribing!
                </div>
              )}
              {status === "error" && (
                <div className="alert alert-danger mt-3 mb-0">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Please enter a valid email address.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}





















