import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../auth/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { fetchProfile } from "../api/authApi";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import SearchBar from "./SearchBar";
import { fetchCategories } from "../api/categoryApi";
import http from "../api/http";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("buyer");
  const [sellerStatus, setSellerStatus] = useState("none");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNotifyOpen, setMobileNotifyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchHistory, setMobileSearchHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("megamart-search-history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const { getTotalItems } = useCart();
  const { items: favorites } = useFavorites();
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const categoriesRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
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
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target)
      ) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    setCategoriesLoading(true);
    fetchCategories(http)
      .then((data) => {
        if (!mounted) return;
        setCategories(Array.isArray(data) ? data : []);
        setCategoriesError("");
      })
      .catch(() => {
        if (!mounted) return;
        setCategoriesError("Failed to load categories");
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setMobileNotifyOpen(false);
    setMobileMenuOpen(false);
    setMobileProfileOpen(false);
    // Don't auto-close search overlay on navigation - let it close after submit
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (mobileSearchOpen) {
      // Focus the search input when overlay opens
      setTimeout(() => {
        const input = document.querySelector(
          ".mega-mobile-search-overlay__field input"
        );
        if (input) input.focus();
      }, 100);
    } else {
      // Clear query when overlay closes
      setMobileSearchQuery("");
    }
  }, [mobileSearchOpen]);

  const favoriteCount = favorites.length;
  const cartCount = getTotalItems();
  const userInitial =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "M";
  const displayName =
    user?.displayName || user?.email?.split("@")?.[0] || "Shopper";
  const showSellerCTA = sellerStatus === "none";
  const mobileDisplayName = user ? displayName : t("nav.signIn");

  const pushSearchHistory = (term) => {
    setMobileSearchHistory((prev) => {
      const next = [term, ...prev.filter((t) => t !== term)].slice(0, 15);
      try {
        localStorage.setItem("megamart-search-history", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMobileSearchSubmit = (term, helpers) => {
    if (!term || !term.trim()) return;
    const searchTerm = typeof term === "string" ? term.trim() : term;
    pushSearchHistory(searchTerm);
    setMobileSearchQuery("");
    // Navigate first, then close overlay after a brief delay to ensure navigation completes
    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    setTimeout(() => {
      setMobileSearchOpen(false);
    }, 100);
    if (helpers?.clear) helpers.clear();
  };
  const primaryNavLinks = [
    { label: t("nav.forYou"), icon: "fa-star", to: "/products?sort=foryou" },
    { label: t("nav.newArrivals"), icon: "fa-bolt", to: "/products?sort=new" },
    { label: t("nav.popular"), icon: "fa-fire", to: "/products?sort=popular" },
    { label: t("nav.sale"), icon: "fa-tag", to: "/products?sort=sale" },
    { label: "All Products", icon: "fa-th", to: "/products" },
    { label: t("nav.disputes"), icon: "fa-life-ring", to: "/disputes" },
  ];

  const mobileQuickFallback = ["Electronics", "Clothes", "Phones", "Books"];

  const mobileQuickCategories = [
    { label: "All", to: "/products" },
    ...(categories.length > 0
      ? categories.map((cat) => ({
          label: cat.name,
          to: `/products?category=${encodeURIComponent(cat.name)}`,
        }))
      : mobileQuickFallback.map((name) => ({
          label: name,
          to: `/products?category=${encodeURIComponent(name)}`,
        }))),
  ];

  const handleMobileChipClick = (to) => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setMobileProfileOpen(false);
    setMobileNotifyOpen(false);
    navigate(to);
  };

  const isPathActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const isNavLinkActive = (linkTo) => {
    // For query string links, check if pathname matches and search params match
    if (linkTo.includes("?")) {
      const [path, query] = linkTo.split("?");
      const params = new URLSearchParams(query);
      const currentParams = new URLSearchParams(location.search);

      // Check if pathname matches
      if (location.pathname !== path && path !== "/products") {
        return false;
      }

      // Check if the specific query param exists and matches
      for (const [key, value] of params.entries()) {
        if (currentParams.get(key) !== value) {
          return false;
        }
      }
      return true;
    }
    // For "All Products" (/products), only active if pathname is exactly /products with no query params
    if (linkTo === "/products") {
      return location.pathname === "/products" && location.search === "";
    }
    // For regular paths, use the existing logic
    return isPathActive(linkTo);
  };

  const toggleMobileNotifications = () => {
    setMobileNotifyOpen((prev) => !prev);
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    setMobileProfileOpen(false);
    setMobileSearchOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    setMobileNotifyOpen(false);
    setMobileProfileOpen(false);
    setMobileSearchOpen(false);
  };

  const toggleMobileProfile = () => {
    setMobileProfileOpen((prev) => !prev);
    setMobileMenuOpen(false);
    setMobileNotifyOpen(false);
    setMobileSearchOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfileOpen(false);
    setMobileProfileOpen(false);
  };

  const handleNotificationClick = async (item) => {
    setNotificationsOpen(false);
    setMobileNotifyOpen(false);
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
    <>
      <header className="mega-header shadow-sm">
        <div className="mega-desktop-shell d-none d-lg-block">
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
                  {t("nav.about")}
                </button>
                <div
                  className="mega-pill mega-language-switcher"
                  style={{ position: "relative" }}
                >
                  <button
                    type="button"
                    className="mega-top-link"
                    onClick={() => setLanguage(language === "en" ? "am" : "en")}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <i className="fas fa-globe-africa me-2"></i>
                    {language === "en" ? "EN" : "አማ"} • ETB
                  </button>
                </div>
                <button
                  type="button"
                  className="mega-top-link"
                  onClick={toggleTheme}
                  title={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                >
                  <i
                    className={`fas ${
                      theme === "dark" ? "fa-sun" : "fa-moon"
                    } me-2`}
                  ></i>
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          </div>

          <div className="mega-header__main container">
            <div className="mega-main-left">
              <Link className="mega-brand" to="/">
                <span className="mega-logo-bag">
                  <i className="bi bi-cart4 text-danger"></i>
                </span>
                <span className="mega-brand-text">
                  <span className="text-highlight">Mega</span>Mart
                </span>
              </Link>
              <div className="mega-category" ref={categoriesRef}>
                <button
                  type="button"
                  className={`mega-category-btn ${
                    categoriesOpen ? "is-open" : ""
                  }`}
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                >
                  <i className="fas fa-bars me-2"></i>
                  {t("nav.categories")}
                  <i
                    className={`fas fa-chevron-${
                      categoriesOpen ? "up" : "down"
                    } ms-2`}
                  ></i>
                </button>
                {categoriesOpen && (
                  <div className="mega-category__dropdown">
                    <div className="mega-category__header">
                      <strong>{t("nav.categories")}</strong>
                      <span className="text-muted small">
                        {categories.length}+
                      </span>
                    </div>
                    <div className="mega-category__grid">
                      {categoriesLoading ? (
                        <div className="mega-category__empty">
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          {t("common.loading")}
                        </div>
                      ) : categoriesError ? (
                        <div className="mega-category__empty">
                          {categoriesError}
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="mega-category__empty">
                          {t("products.noProducts")}
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <Link
                            key={cat._id}
                            to={`/products?category=${encodeURIComponent(
                              cat.name
                            )}`}
                            className="mega-category__item"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <span>{cat.name}</span>
                            <i className="fas fa-chevron-right"></i>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <SearchBar
              className="mega-search"
              placeholder="Search products, brands, categories..."
              maxWidth={null}
            />

            <div className="mega-main-right">
              <div className="mega-header__actions">
                <Link
                  to="/favorites"
                  className="mega-icon-btn mega-favorites-icon"
                  title={t("nav.favorites")}
                >
                  <i className="far fa-heart"></i>
                  {favoriteCount > 0 && (
                    <span className="mega-icon-badge">{favoriteCount}</span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  className="mega-icon-btn mega-cart-icon"
                  title={t("nav.cart")}
                >
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && (
                    <span className="mega-icon-badge">{cartCount}</span>
                  )}
                </Link>
                <div className="mega-notify" ref={notificationRef}>
                  <button
                    type="button"
                    className="mega-icon-btn"
                    title={t("nav.notifications")}
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
                          <div className="fw-semibold">
                            {t("nav.notifications")}
                          </div>
                          <small className="text-muted">
                            {unreadCount > 0
                              ? `${unreadCount} ${t("nav.unread")}`
                              : t("nav.allCaughtUp")}
                          </small>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="mega-notify__action"
                            onClick={() => markAllAsRead()}
                          >
                            {t("nav.markAll")}
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
                                  className={`fas fa-${
                                    item.icon || "bell"
                                  } text-${item.severity || "info"}`}
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
                            {t("common.loading")}
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
                  {t("nav.becomeSeller")}
                </Link>
              )}

              {!user && (
                <div className="mega-auth-cta">
                  <Link
                    to="/login"
                    className="mega-auth-tab mega-auth-tab--outline"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    to="/register"
                    className="mega-auth-tab mega-auth-tab--filled"
                  >
                    {t("nav.signUp")}
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
                      <div className="mega-profile__hello">
                        Hi, {displayName}
                      </div>
                      <small className="text-muted text-capitalize">
                        {role}
                      </small>
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
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                        >
                          <i className="fas fa-user-circle me-2"></i>
                          {t("nav.profile")}
                        </Link>
                        <Link
                          to="/disputes"
                          onClick={() => setProfileOpen(false)}
                        >
                          <i className="fas fa-life-ring me-2"></i>
                          {t("nav.disputes")}
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setProfileOpen(false)}
                        >
                          <i className="fas fa-heart me-2"></i>
                          {t("nav.favorites")}
                        </Link>
                        {cartCount > 0 && (
                          <Link
                            to="/cart"
                            onClick={() => setProfileOpen(false)}
                          >
                            <i className="fas fa-shopping-basket me-2"></i>
                            {t("nav.cart")} ({cartCount})
                          </Link>
                        )}
                        {role === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setProfileOpen(false)}
                          >
                            <i className="fas fa-tachometer-alt me-2"></i>
                            {t("nav.admin")}
                          </Link>
                        )}
                        {(role === "seller" || sellerStatus !== "none") && (
                          <Link
                            to="/seller"
                            onClick={() => setProfileOpen(false)}
                          >
                            <i className="fas fa-store me-2"></i>
                            {t("nav.seller")} Center
                          </Link>
                        )}
                        <button type="button" onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt me-2"></i>
                          {t("nav.logout")}
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
                <Link
                  key={link.label}
                  to={link.to}
                  className={isNavLinkActive(link.to) ? "is-active" : ""}
                >
                  <i className={`fas ${link.icon} me-2`}></i>
                  {link.label}
                </Link>
              ))}
              {((role === "seller" && sellerStatus === "approved") ||
                sellerStatus === "pending" ||
                sellerStatus === "rejected") && (
                <Link
                  to="/seller"
                  className={isPathActive("/seller") ? "is-active" : ""}
                >
                  <i className="fas fa-store me-2"></i>
                  {t("nav.seller")}
                </Link>
              )}
              {role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className={isPathActive("/admin") ? "is-active" : ""}
                >
                  <i className="fas fa-tachometer-alt me-2"></i>
                  {t("nav.admin")}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mega-mobile-shell d-lg-none">
          <div className="mega-mobile-topline">
            <button
              type="button"
              className="mega-mobile-icon-btn"
              onClick={toggleMobileMenu}
              aria-label="Open menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <Link className="mega-mobile-brandline" to="/">
              <i className="bi bi-cart4 text-danger"></i>
              <span>
                <span className="text-highlight">Mega</span>Mart
              </span>
            </Link>
            <button
              type="button"
              className="mega-mobile-icon-btn"
              onClick={toggleMobileProfile}
              aria-label="Open profile"
            >
              <i className="bi bi-person"></i>
              <span className="mega-mobile-user-label">
                ({mobileDisplayName})
              </span>
            </button>
          </div>

          <button
            type="button"
            className="mega-mobile-search-trigger"
            onClick={() => {
              setMobileSearchOpen(true);
              setMobileMenuOpen(false);
              setMobileProfileOpen(false);
              setMobileNotifyOpen(false);
            }}
          >
            <span className="mega-mobile-search-trigger-input">
              <span className="placeholder">
                {t("products.searchPlaceholder")}
              </span>
            </span>
            <span className="mega-mobile-search-trigger-icon">
              <i className="bi bi-search"></i>
            </span>
          </button>

          <div className="mega-mobile-category-bar">
            {mobileQuickCategories.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className={`mega-mobile-category-chip ${
                  isNavLinkActive(chip.to) ? "is-active" : ""
                }`}
                onClick={() => handleMobileChipClick(chip.to)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="mega-mobile-bottom-nav navbar fixed-bottom bg-light d-lg-none border-top shadow-sm">
        <div className="container-fluid d-flex justify-content-around align-items-center text-center px-0">
          <Link
            to="/"
            className={`mega-mobile-bottom-link ${
              isPathActive("/") ? "is-active" : ""
            }`}
          >
            <i className="bi bi-house"></i>
            <small>{t("nav.home")}</small>
          </Link>
          <Link
            to="/cart"
            className={`mega-mobile-bottom-link mega-mobile-cart-icon position-relative ${
              isPathActive("/cart") ? "is-active" : ""
            }`}
          >
            <i className="bi bi-cart"></i>
            {cartCount > 0 && (
              <span className="mega-mobile-count badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
            <small>{t("nav.cart")}</small>
          </Link>
          <div className="mega-mobile-bottom-center">
            <Link to="/products">
              <img
                src="https://i.postimg.cc/Z5Bm8KPh/logo4.png"
                alt="MegaMart"
              />
            </Link>
          </div>
          <Link
            to="/favorites"
            className={`mega-mobile-bottom-link mega-mobile-favorites-icon position-relative ${
              isPathActive("/favorites") ? "is-active" : ""
            }`}
          >
            <i className="bi bi-heart"></i>
            {favoriteCount > 0 && (
              <span className="mega-mobile-count badge rounded-pill bg-danger">
                {favoriteCount}
              </span>
            )}
            <small>{t("nav.favorites")}</small>
          </Link>
          <button
            type="button"
            className={`mega-mobile-bottom-link position-relative ${
              mobileNotifyOpen ? "is-active" : ""
            }`}
            onClick={toggleMobileNotifications}
          >
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && (
              <span className="mega-mobile-count badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
            <small>{t("nav.notifications")}</small>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mega-mobile-sheet d-lg-none">
          <div
            className="mega-mobile-sheet__backdrop"
            onClick={toggleMobileMenu}
          ></div>
          <div className="mega-mobile-sheet__panel">
            <div className="mega-mobile-sheet__header">
              <div>
                <div className="fw-semibold">{t("nav.categories")}</div>
                <small className="text-muted">
                  {t("products.context.popularText")}
                </small>
              </div>
              <button
                type="button"
                className="mega-mobile-pill"
                onClick={toggleMobileMenu}
              >
                {t("common.close")}
              </button>
            </div>
            <div className="mega-mobile-sheet__list">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`mega-mobile-sheet__item ${
                    isNavLinkActive(link.to) ? "is-active" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>
                    <i className={`fas ${link.icon} me-3`}></i>
                    {link.label}
                  </span>
                  <i className="fas fa-chevron-right text-muted"></i>
                </Link>
              ))}
            </div>
            <div className="mega-mobile-sheet__controls">
              <button
                type="button"
                className="mega-mobile-pill"
                onClick={() => {
                  setLanguage(language === "en" ? "am" : "en");
                  setMobileMenuOpen(false);
                }}
              >
                <i className="fas fa-globe-africa me-2"></i>
                {language === "en" ? "አማ" : "EN"} • ETB
              </button>
              <button
                type="button"
                className="mega-mobile-pill"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
              >
                <i
                  className={`fas ${
                    theme === "dark" ? "fa-sun" : "fa-moon"
                  } me-2`}
                ></i>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileProfileOpen && (
        <div className="mega-mobile-sheet d-lg-none">
          <div
            className="mega-mobile-sheet__backdrop"
            onClick={() => setMobileProfileOpen(false)}
          ></div>
          <div className="mega-mobile-sheet__panel">
            {user ? (
              <>
                <div className="mega-mobile-sheet__header">
                  <div>
                    <div className="fw-semibold">
                      {t("nav.profile")} • {displayName}
                    </div>
                    <small className="text-muted">{user.email}</small>
                  </div>
                  <button
                    type="button"
                    className="mega-mobile-pill"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    {t("common.close")}
                  </button>
                </div>
                <div className="mega-mobile-sheet__list">
                  <Link
                    to="/profile"
                    className="mega-mobile-sheet__item"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <span>
                      <i className="fas fa-user-circle me-3"></i>
                      {t("nav.profile")}
                    </span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </Link>
                  <Link
                    to="/favorites"
                    className="mega-mobile-sheet__item"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <span>
                      <i className="fas fa-heart me-3"></i>
                      {t("nav.favorites")}
                    </span>
                    <span className="text-muted">{favoriteCount}</span>
                  </Link>
                  <Link
                    to="/cart"
                    className="mega-mobile-sheet__item"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <span>
                      <i className="fas fa-shopping-basket me-3"></i>
                      {t("nav.cart")}
                    </span>
                    <span className="text-muted">{cartCount}</span>
                  </Link>
                  <Link
                    to="/disputes"
                    className="mega-mobile-sheet__item"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <span>
                      <i className="fas fa-life-ring me-3"></i>
                      {t("nav.disputes")}
                    </span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </Link>
                  {(role === "seller" || sellerStatus !== "none") && (
                    <Link
                      to="/seller"
                      className="mega-mobile-sheet__item"
                      onClick={() => setMobileProfileOpen(false)}
                    >
                      <span>
                        <i className="fas fa-store me-3"></i>
                        {t("nav.seller")} Center
                      </span>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="mega-mobile-sheet__item"
                      onClick={() => setMobileProfileOpen(false)}
                    >
                      <span>
                        <i className="fas fa-tachometer-alt me-3"></i>
                        {t("nav.admin")}
                      </span>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </Link>
                  )}
                  {showSellerCTA && (
                    <Link
                      to="/seller"
                      className="mega-mobile-sheet__item"
                      onClick={() => setMobileProfileOpen(false)}
                    >
                      <span>
                        <i className="fas fa-briefcase me-3"></i>
                        {t("nav.becomeSeller")}
                      </span>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mega-mobile-sheet__item text-start"
                    onClick={handleLogout}
                  >
                    <span>
                      <i className="fas fa-sign-out-alt me-3"></i>
                      {t("nav.logout")}
                    </span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mega-mobile-sheet__header">
                  <div>
                    <div className="fw-semibold">{t("nav.signIn")}</div>
                    <small className="text-muted">
                      {t("auth.welcomeSubtitle")}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="mega-mobile-pill"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    {t("common.close")}
                  </button>
                </div>
                <div className="mega-mobile-auth">
                  <Link
                    to="/login"
                    className="btn btn-orange w-100 mb-3"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-light w-100"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    {t("nav.signUp")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mobileNotifyOpen && (
        <div className="mega-mobile-notify d-lg-none">
          <div
            className="mega-mobile-notify__backdrop"
            onClick={() => setMobileNotifyOpen(false)}
          ></div>
          <div className="mega-mobile-notify__panel">
            <div className="mega-mobile-notify__header">
              <div>
                <div className="fw-semibold">{t("nav.notifications")}</div>
                <small className="text-muted">
                  {unreadCount > 0
                    ? `${unreadCount} ${t("nav.unread")}`
                    : t("nav.allCaughtUp")}
                </small>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="mega-mobile-pill"
                  onClick={() => setMobileNotifyOpen(false)}
                >
                  {t("common.close")}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mega-mobile-pill"
                    onClick={() => {
                      markAllAsRead();
                      setMobileNotifyOpen(false);
                    }}
                  >
                    {t("nav.markAll")}
                  </button>
                )}
              </div>
            </div>
            <div className="mega-mobile-notify__list">
              {notificationsLoading ? (
                <div className="mega-notify__empty">{t("common.loading")}</div>
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
                      <div className="mega-notify__title">{item.title}</div>
                      {item.body && (
                        <div className="mega-notify__text">{item.body}</div>
                      )}
                      <small className="text-muted">
                        {formatNotificationTime(item.createdAt)}
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="mega-notify__empty">{t("common.loading")}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {mobileSearchOpen && (
        <div className="mega-mobile-search-overlay d-lg-none">
          <div className="mega-mobile-search-overlay__header">
            <button
              type="button"
              className="mega-mobile-icon-btn"
              onClick={() => setMobileSearchOpen(false)}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div className="mega-mobile-search-overlay__field">
              <i className="bi bi-search overlay-icon-left"></i>
              <SearchBar
                className="mega-search overlay"
                placeholder={t("products.searchPlaceholder")}
                maxWidth={null}
                value={mobileSearchQuery}
                onChange={(value) => setMobileSearchQuery(value)}
                onSubmit={(term) => {
                  if (term && term.trim()) {
                    handleMobileSearchSubmit(term);
                  }
                }}
              />
              {mobileSearchQuery && (
                <button
                  type="button"
                  className="mega-mobile-search-clear"
                  onClick={() => setMobileSearchQuery("")}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
          <div className="mega-mobile-search-overlay__body">
            <div className="mega-mobile-search-section">
              <div className="mega-mobile-search-section__title">
                {t("common.search")} history
              </div>
              <div className="mega-mobile-search-tags">
                {mobileSearchHistory.length ? (
                  mobileSearchHistory.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="mega-mobile-search-tag"
                      onClick={() => handleMobileSearchSubmit(item)}
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <div className="text-muted small">
                    {t("products.noProducts")}
                  </div>
                )}
              </div>
            </div>
            <div className="mega-mobile-search-section">
              <div className="mega-mobile-search-section__title">
                Discover more
              </div>
              <div className="mega-mobile-search-tags">
                {mobileQuickCategories.slice(0, 12).map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    className="mega-mobile-search-tag"
                    onClick={() =>
                      navigate(
                        `/products?search=${encodeURIComponent(chip.label)}`
                      )
                    }
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
