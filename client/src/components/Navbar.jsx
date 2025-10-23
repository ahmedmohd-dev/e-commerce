import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../auth/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { fetchProfile } from "../api/authApi";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const { getTotalItems } = useCart();
  const { items: favorites } = useFavorites();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profile = await fetchProfile();
          setRole(profile.role || "user");
        } catch {}
      } else {
        setRole("user");
      }
    });
    return () => unsub();
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Shop
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarsExample"
          aria-controls="navbarsExample"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarsExample">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/products">
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/qr-scanner">
                <i className="fas fa-qrcode me-1"></i>
                QR Scanner
              </Link>
            </li>
            {role === "admin" && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin
                </Link>
              </li>
            )}
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/favorites">
                <i className="fas fa-heart"></i>
                {favorites.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {favorites.length}
                  </span>
                )}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/cart">
                <i className="fas fa-shopping-cart"></i>
                {getTotalItems() > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            {!user && (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
            )}
            {user && (
              <>
                <li className="nav-item">
                  <span className="nav-link">{user.email}</span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => signOut(auth)}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
