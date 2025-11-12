import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("buyer"); // "buyer" or "seller"
  const [sellerProfile, setSellerProfile] = useState({
    shopName: "",
    phone: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // Create Firebase account
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      // Register user in backend
      try {
        await registerUser({
          firebaseUid: cred.user.uid,
          email: cred.user.email,
          displayName: name,
          role: userType,
          sellerProfile: userType === "seller" ? sellerProfile : undefined,
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
        // Still allow login even if backend registration fails (auth middleware will create user)
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 600 }}>
      <h2>Create Account</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">I want to register as:</label>
          <div className="d-flex gap-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="userType"
                id="buyer"
                value="buyer"
                checked={userType === "buyer"}
                onChange={(e) => setUserType(e.target.value)}
              />
              <label className="form-check-label" htmlFor="buyer">
                <strong>Buyer</strong>
                <br />
                <small className="text-muted">
                  Browse and purchase products
                </small>
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="userType"
                id="seller"
                value="seller"
                checked={userType === "seller"}
                onChange={(e) => setUserType(e.target.value)}
              />
              <label className="form-check-label" htmlFor="seller">
                <strong>Seller</strong>
                <br />
                <small className="text-muted">
                  Sell products (requires approval)
                </small>
              </label>
            </div>
          </div>
        </div>
        {userType === "seller" && (
          <div className="card border-primary mb-3">
            <div className="card-header bg-primary bg-opacity-10">
              <strong>Seller Application Details</strong>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Shop Name *</label>
                <input
                  className="form-control"
                  value={sellerProfile.shopName}
                  onChange={(e) =>
                    setSellerProfile({
                      ...sellerProfile,
                      shopName: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter your shop/business name"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number *</label>
                <input
                  className="form-control"
                  value={sellerProfile.phone}
                  onChange={(e) =>
                    setSellerProfile({
                      ...sellerProfile,
                      phone: e.target.value,
                    })
                  }
                  required
                  placeholder="Your contact phone number"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Shop Description</label>
                <textarea
                  className="form-control"
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
              <div className="alert alert-info mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Your seller application will be reviewed by an admin. You'll be
                notified once approved.
              </div>
            </div>
          </div>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Creating Account..." : "Create Account"}
        </button>{" "}
        <Link to="/login" className="ms-2">
          Already have an account? Login
        </Link>
      </form>
    </div>
  );
}
