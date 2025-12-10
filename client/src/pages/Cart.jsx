import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getEffectivePrice, formatETB, isSaleActive } from "../utils/pricing";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } =
    useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mt-5 page-bottom-gap">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <button
                  type="button"
                  className="btn btn-light btn-sm mb-3"
                  onClick={() => navigate(-1)}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back
                </button>
                <i className="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
                <h3 className="text-muted">{t("cart.empty")}</h3>
                <p className="text-muted mb-4">{t("cart.empty")}</p>
                <Link to="/products" className="btn btn-primary btn-lg">
                  <i className="fas fa-shopping-bag me-2"></i>
                  {t("home.shopNow")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 page-bottom-gap">
      <button
        type="button"
        className="btn btn-light btn-sm mb-3"
        onClick={() => navigate(-1)}
      >
        <i className="fas fa-arrow-left me-1"></i>
        Back
      </button>
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-6 fw-bold">{t("cart.title")}</h1>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={clearCart}
            >
              <i className="fas fa-trash me-1"></i>
              {t("common.clear")} {t("cart.title")}
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {items.map((item) => (
                <div key={item.product._id} className="border-bottom p-4">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        className="img-fluid rounded"
                        style={{ height: "80px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="col-md-4">
                      <h6 className="fw-bold mb-1">{item.product.name}</h6>
                      <p className="text-muted small mb-0">
                        {item.product.description}
                      </p>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column">
                        {isSaleActive(item.product) && (
                          <span className="text-muted text-decoration-line-through small">
                            {formatETB(item.product.price)}
                          </span>
                        )}
                        <span className="h6 text-primary">
                          {formatETB(getEffectivePrice(item.product))}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="input-group input-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.product._id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity + 1)
                          }
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h6 mb-0">
                          {formatETB(
                            getEffectivePrice(item.product) * item.quantity
                          )}
                        </span>
                        <button
                          className="btn btn-outline-danger btn-sm ms-2"
                          onClick={() => removeFromCart(item.product._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-4">{t("cart.title")}</h5>

              <div className="d-flex justify-content-between mb-2">
                <span>
                  {t("cart.subtotal")} ({items.length} {t("common.items")})
                </span>
                <span>{formatETB(getTotalPrice())}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>{t("products.freeShipping")}</span>
                <span className="text-success">{t("common.free")}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>{t("common.tax")}</span>
                <span>{formatETB(getTotalPrice() * 0.1)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <span className="h5 fw-bold">{t("cart.total")}</span>
                <span className="h5 fw-bold text-primary">
                  {formatETB(getTotalPrice() * 1.1)}
                </span>
              </div>

              <div className="d-grid gap-2">
                <Link to="/checkout" className="btn btn-primary btn-lg">
                  <i className="fas fa-credit-card me-2"></i>
                  {t("cart.checkout")}
                </Link>
                <Link to="/products" className="btn btn-outline-primary">
                  <i className="fas fa-arrow-left me-2"></i>
                  {t("cart.continueShopping")}
                </Link>
              </div>

              <div className="mt-4">
                <div className="row text-center">
                  <div className="col-4">
                    <i className="fas fa-shipping-fast fa-2x text-primary mb-2"></i>
                    <p className="small mb-0">{t("products.freeShipping")}</p>
                  </div>
                  <div className="col-4">
                    <i className="fas fa-undo fa-2x text-primary mb-2"></i>
                    <p className="small mb-0">{t("products.easyReturns")}</p>
                  </div>
                  <div className="col-4">
                    <i className="fas fa-shield-alt fa-2x text-primary mb-2"></i>
                    <p className="small mb-0">{t("products.securePayment")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
