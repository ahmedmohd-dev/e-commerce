import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../api/http";
import { downloadReceipt } from "../utils/receiptGenerator";
import ReceiptPreview from "../components/ReceiptPreview";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await http.get(`/api/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleDownloadReceipt = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      await downloadReceipt(order);
    } catch (error) {
      console.error("Failed to download receipt:", error);
      alert(t("orders.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("common.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-exclamation-triangle fa-4x text-warning mb-4"></i>
                <h3 className="text-muted">{t("orders.notFound")}</h3>
                <p className="text-muted mb-4">
                  {t("orders.notFoundDescription")}
                </p>
                <Link to="/" className="btn btn-primary btn-lg">
                  <i className="fas fa-home me-2"></i>
                  {t("orders.goHome")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "paid":
      case "processing":
        return "info";
      case "shipped":
        return "primary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "fa-clock";
      case "paid":
        return "fa-money-bill";
      case "processing":
        return "fa-box-open";
      case "shipped":
        return "fa-shipping-fast";
      case "completed":
        return "fa-check-double";
      case "cancelled":
        return "fa-times-circle";
      default:
        return "fa-question-circle";
    }
  };

  const translateStatus = (status, translate) => {
    if (!status) {
      const fallback = translate("orders.pending");
      return fallback === "orders.pending" ? "Pending" : fallback;
    }
    const key = `orders.${status}`;
    const label = translate(key);
    if (label === key) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    return label;
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="text-center mb-5">
            <i className="fas fa-check-circle fa-5x text-success mb-4"></i>
            <h1 className="display-5 fw-bold text-success">
              {t("orders.confirmedTitle")}
            </h1>
            <p className="lead text-muted">{t("orders.confirmedMessage")}</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Receipt Preview */}
          <ReceiptPreview order={order} showQRCode={true} />

          {/* Order Details */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-receipt me-2"></i>
                {t("orders.orderDetails")}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold">{t("orders.orderNumber")}</h6>
                  <p className="text-muted">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>

                  <h6 className="fw-bold">{t("orders.orderDate")}</h6>
                  <p className="text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold">{t("orders.orderStatus")}</h6>
                  <span
                    className={`badge bg-${getStatusColor(order.status)} fs-6`}
                  >
                    <i
                      className={`fas ${getStatusIcon(order.status)} me-1`}
                    ></i>
                    {translateStatus(order.status, t)}
                  </span>

                  <h6 className="fw-bold mt-3">{t("orders.paymentMethod")}</h6>
                  <p className="text-muted">
                    <i
                      className={`fas ${
                        order.paymentMethod === "telebirr"
                          ? "fa-mobile-alt"
                          : "fab fa-paypal"
                      } me-2`}
                    ></i>
                    {order.paymentMethod === "telebirr"
                      ? t("orders.paymentMethods.telebirr")
                      : t("orders.paymentMethods.paypal")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                {t("orders.shippingAddress")}
              </h5>
            </div>
            <div className="card-body">
              <address className="mb-0">
                <strong>
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </strong>
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
                <br />
                {order.shippingAddress.country}
                <br />
                <i className="fas fa-phone me-1"></i>{" "}
                {order.shippingAddress.phone}
                <br />
                <i className="fas fa-envelope me-1"></i>{" "}
                {order.shippingAddress.email}
              </address>
            </div>
          </div>

          {/* Order Items */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>
                {t("orders.orderItems")}
              </h5>
            </div>
            <div className="card-body p-0">
              {order.items.map((item, index) => (
                <div key={index} className="border-bottom p-4">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        className="img-fluid rounded"
                        style={{ height: "60px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-1">{item.product.name}</h6>
                      <p className="text-muted small mb-0">
                        {item.product.description}
                      </p>
                    </div>
                    <div className="col-md-2 text-center">
                      <span className="text-muted">
                        {t("orders.quantityShort")}: {item.quantity}
                      </span>
                    </div>
                    <div className="col-md-2 text-end">
                      <span className="fw-bold">
                        ETB{" "}
                        {(
                          (item.price || 0) * (item.quantity || 1)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div
            className="card border-0 shadow-sm sticky-top"
            style={{ top: "20px" }}
          >
            <div className="card-header bg-light">
              <h5 className="mb-0">{t("orders.orderSummary")}</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>{t("orders.subtotal")}</span>
                <span>
                  ETB{" "}
                  {(
                    order.subtotal ||
                    order.totalPrice ||
                    order.total ||
                    0
                  ).toLocaleString()}
                </span>
              </div>

              {order.tax && (
                <div className="d-flex justify-content-between mb-2">
                  <span>{t("orders.tax")}</span>
                  <span>ETB {order.tax.toLocaleString()}</span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2">
                <span>{t("orders.shipping")}</span>
                <span className="text-success">
                  {order.shipping === 0
                    ? t("common.free")
                    : `ETB ${order.shipping}`}
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <span className="h5 fw-bold">{t("orders.total")}</span>
                <span className="h5 fw-bold text-primary">
                  ETB{" "}
                  {(
                    order.totalPrice ||
                    order.total ||
                    order.amount ||
                    0
                  ).toLocaleString()}
                </span>
              </div>

              {order.notes && (
                <div className="mb-3">
                  <h6 className="fw-bold">{t("orders.orderNotes")}</h6>
                  <p className="text-muted small">{order.notes}</p>
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      {t("orders.generatingReceipt")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      {t("orders.downloadReceipt")}
                    </>
                  )}
                </button>
                <Link to="/products" className="btn btn-primary">
                  <i className="fas fa-shopping-bag me-2"></i>
                  {t("orders.continueShopping")}
                </Link>
                <Link to="/profile" className="btn btn-outline-primary">
                  <i className="fas fa-user me-2"></i>
                  {t("orders.viewProfile")}
                </Link>
              </div>

              <div className="mt-4 text-center">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  {t("orders.emailConfirmation")}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
