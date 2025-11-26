import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../auth/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { fetchProfile } from "../api/authApi";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import SearchBar from "./SearchBar";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("buyer");
  const [sellerStatus, setSellerStatus] = useState("none");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { items: favorites } = useFavorites();
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profile = await fetchProfile();
          setRole(profile.role || "buyer");
          setSellerStatus(profile.sellerStatus || "none");
        } catch {
          setRole("buyer");
          setSellerStatus("none");
        }
      } else {
        setRole("buyer");
        setSellerStatus("none");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const favoriteCount = favorites.length;
  const cartCount = getTotalItems();
  const userInitial =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "M";
  const displayName =
    user?.displayName || user?.email?.split("@")?.[0] || "Shopper";
  const showSellerCTA = sellerStatus === "none";
  const primaryNavLinks = [
    { label: "For You", icon: "fa-star", to: "/products" },
    { label: "New Arrivals", icon: "fa-bolt", to: "/products?sort=new" },
    { label: "Popular", icon: "fa-fire", to: "/products?sort=popular" },
    { label: "Sale", icon: "fa-tag", to: "/products?sort=sale" },
    { label: "Disputes", icon: "fa-life-ring", to: "/disputes" },
    { label: "QR Scanner", icon: "fa-qrcode", to: "/qr-scanner" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    setProfileOpen(false);
  };

  const handleNotificationClick = async (item) => {
    setNotificationsOpen(false);
    if (item && !item.read) {
      await markAsRead(item._id);
    }
    if (item?.link) {
      navigate(item.link);
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="mega-header shadow-sm">
      <div className="mega-header__top">
        <div className="container mega-top-inner">
          <div className="mega-header__top-links">
            <button type="button" className="mega-top-link">
              <i className="fas fa-download me-2"></i>
              Download App
            </button>
            <button type="button" className="mega-top-link">
              <i className="fas fa-headset me-2"></i>
              Support
            </button>
            <span className="mega-top-link d-none d-md-inline-flex">
              <i className="fas fa-phone-alt me-2"></i>
              +251-913-36-7176
            </span>
          </div>
          <div className="mega-header__top-links mega-top-right">
            <button type="button" className="mega-top-link">
              About MegaMart
            </button>
            <div className="mega-pill">
              <i className="fas fa-globe-africa me-2"></i>
              EN • ETB
            </div>
          </div>
        </div>
      </div>

      <div className="mega-header__main container">
        <div className="mega-main-left">
          <Link className="mega-brand" to="/">
            <span className="mega-logo-bag">
              <i className="fas fa-shopping-bag"></i>
            </span>
            MegaMart
          </Link>

          <button type="button" className="mega-category-btn">
            <i className="fas fa-bars me-2"></i>
            Categories
            <i className="fas fa-chevron-down ms-2"></i>
          </button>
        </div>

        <SearchBar
          className="mega-search"
          placeholder="Search products, brands, categories..."
          maxWidth={null}
        />

        <div className="mega-main-right">
          <div className="mega-header__actions">
            <Link to="/favorites" className="mega-icon-btn" title="Favorites">
              <i className="far fa-heart"></i>
              {favoriteCount > 0 && (
                <span className="mega-icon-badge">{favoriteCount}</span>
              )}
            </Link>
            <Link to="/cart" className="mega-icon-btn" title="Cart">
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && (
                <span className="mega-icon-badge">{cartCount}</span>
              )}
            </Link>
            <button
              type="button"
              className="mega-icon-btn"
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={toggleTheme}
            >
              <i
                className={theme === "dark" ? "fas fa-sun" : "fas fa-moon"}
              ></i>
            </button>
            <div className="mega-notify" ref={notificationRef}>
              <button
                type="button"
                className="mega-icon-btn"
                title="Notifications"
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <i className="far fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="mega-icon-badge">{unreadCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="mega-notify__dropdown">
                  <div className="mega-notify__header">
                    <div>
                      <div className="fw-semibold">Notifications</div>
                      <small className="text-muted">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </small>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="mega-notify__action"
                        onClick={() => markAllAsRead()}
                      >
                        Mark all
                      </button>
                    )}
                  </div>
                  <div className="mega-notify__list">
                    {notificationsLoading ? (
                      <div className="mega-notify__empty">Loading...</div>
                    ) : notifications.length ? (
                      notifications.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          className={`mega-notify__item ${
                            item.read ? "" : "mega-notify__item--unread"
                          }`}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <div className="mega-notify__icon">
                            <i
                              className={`fas fa-${item.icon || "bell"} text-${
                                item.severity || "info"
                              }`}
                            ></i>
                          </div>
                          <div className="mega-notify__body">
                            <div className="mega-notify__title">
                              {item.title}
                            </div>
                            {item.body && (
                              <div className="mega-notify__text">
                                {item.body}
                              </div>
                            )}
                            <small className="text-muted">
                              {formatNotificationTime(item.createdAt)}
                            </small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="mega-notify__empty">
                        No notifications yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showSellerCTA && (
            <Link
              className="btn btn-orange-outline mega-seller-btn"
              to="/seller"
            >
              Become Seller
            </Link>
          )}

          {!user && (
            <div className="mega-auth-cta">
              <Link to="/login" className="btn btn-light fw-semibold">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-orange">
                Sign Up
              </Link>
            </div>
          )}

          {user && (
            <div className="mega-profile" ref={profileRef}>
              <button
                type="button"
                className="mega-profile__trigger"
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <div className="mega-profile__avatar">{userInitial}</div>
                <div className="mega-profile__info">
                  <div className="mega-profile__hello">Hi, {displayName}</div>
                  <small className="text-muted text-capitalize">{role}</small>
                </div>
                <i
                  className={`fas fa-chevron-${
                    profileOpen ? "up" : "down"
                  } text-muted`}
                ></i>
              </button>

              {profileOpen && (
                <div className="mega-profile__dropdown">
                  <div className="mega-profile__header">
                    <div className="mega-profile__avatar mega-profile__avatar-lg">
                      {userInitial}
                    </div>
                    <div>
                      <div className="fw-semibold">{displayName}</div>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                  <div className="mega-profile__menu">
                    <Link to="/profile" onClick={() => setProfileOpen(false)}>
                      <i className="fas fa-user-circle me-2"></i>
                      Profile
                    </Link>
                    <Link to="/disputes" onClick={() => setProfileOpen(false)}>
                      <i className="fas fa-life-ring me-2"></i>
                      Disputes
                    </Link>
                    <Link to="/favorites" onClick={() => setProfileOpen(false)}>
                      <i className="fas fa-heart me-2"></i>
                      Favorites
                    </Link>
                    {cartCount > 0 && (
                      <Link to="/cart" onClick={() => setProfileOpen(false)}>
                        <i className="fas fa-shopping-basket me-2"></i>
                        Cart ({cartCount})
                      </Link>
                    )}
                    {role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt me-2"></i>
                        Admin
                      </Link>
                    )}
                    {(role === "seller" || sellerStatus !== "none") && (
                      <Link to="/seller" onClick={() => setProfileOpen(false)}>
                        <i className="fas fa-store me-2"></i>
                        Seller Center
                      </Link>
                    )}
                    <button type="button" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mega-header__nav">
        <div className="container mega-header__nav-links">
          {primaryNavLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              <i className={`fas ${link.icon} me-2`}></i>
              {link.label}
            </Link>
          ))}
          {((role === "seller" && sellerStatus === "approved") ||
            sellerStatus === "pending" ||
            sellerStatus === "rejected") && (
            <Link to="/seller">
              <i className="fas fa-store me-2"></i>
              Seller
            </Link>
          )}
          {role === "admin" && (
            <Link to="/admin/dashboard">
              <i className="fas fa-tachometer-alt me-2"></i>
              Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
