import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Favorites from "../pages/Favorites";
import OrderConfirmation from "../pages/OrderConfirmation";
import OrderTracking from "../pages/OrderTracking";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import AdminProducts from "../pages/AdminProducts";
import AdminDashboard from "../pages/AdminDashboard";
import AdminCategories from "../pages/AdminCategories";
import AdminBrands from "../pages/AdminBrands";
import SellerDashboard from "../pages/SellerDashboard";
import DisputePage from "../pages/DisputePage";
import ContactSellerPage from "../pages/ContactSellerPage";
import Navbar from "../components/Navbar.jsx";
import { auth } from "../auth/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { CartProvider, useCart } from "../contexts/CartContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import IntroAnimation from "../components/IntroAnimation";
import CartToast from "../components/CartToast";
import ScrollToTop from "../components/ScrollToTop";
import Footer from "../components/Footer";

function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);
  if (!ready) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function ConditionalNavbar() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  if (hideNavbar) return null;
  return <Navbar />;
}

function ConditionalFooter() {
  const location = useLocation();
  const hideFooter =
    location.pathname === "/login" || location.pathname === "/register";

  if (hideFooter) return null;
  return <Footer />;
}

function CartToastWrapper() {
  const { toastState, setToastState } = useCart();

  if (!toastState) return null;

  return (
    <CartToast
      show={toastState.show}
      productName={toastState.productName}
      onClose={() => setToastState({ show: false, productName: "" })}
    />
  );
}

export default function AppRouter() {
  const [showIntro, setShowIntro] = React.useState(true);

  React.useEffect(() => {
    // Check if user has seen intro before
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setShowIntro(false);
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <NotificationProvider>
                {showIntro && (
                  <IntroAnimation onComplete={handleIntroComplete} />
                )}
                <BrowserRouter>
                  <ScrollToTop />
                  <CartToastWrapper />
                  <ConditionalNavbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/all-products" element={<Products />} />
                    <Route path="/product/:slug" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route
                      path="/order-confirmation/:orderId"
                      element={
                        <ProtectedRoute>
                          <OrderConfirmation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order-tracking/:orderId"
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/seller"
                      element={
                        <ProtectedRoute>
                          <SellerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute>
                          <AdminProducts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/categories"
                      element={
                        <ProtectedRoute>
                          <AdminCategories />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/brands"
                      element={
                        <ProtectedRoute>
                          <AdminBrands />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/disputes"
                      element={
                        <ProtectedRoute>
                          <DisputePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/disputes/new/:orderId"
                      element={
                        <ProtectedRoute>
                          <DisputePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders/:orderId/contact"
                      element={
                        <ProtectedRoute>
                          <ContactSellerPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <ConditionalFooter />
                </BrowserRouter>
              </NotificationProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
