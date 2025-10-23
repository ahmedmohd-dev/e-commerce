import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../api/http";
import { downloadReceipt } from "../utils/receiptGenerator";
import ReceiptPreview from "../components/ReceiptPreview";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
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
                <h3 className="text-muted">Order not found</h3>
                <p className="text-muted mb-4">
                  The order you're looking for doesn't exist.
                </p>
                <Link to="/" className="btn btn-primary btn-lg">
                  <i className="fas fa-home me-2"></i>
                  Go Home
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
      case "confirmed":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
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
      case "confirmed":
        return "fa-check-circle";
      case "shipped":
        return "fa-shipping-fast";
      case "delivered":
        return "fa-check-double";
      case "cancelled":
        return "fa-times-circle";
      default:
        return "fa-question-circle";
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="text-center mb-5">
            <i className="fas fa-check-circle fa-5x text-success mb-4"></i>
            <h1 className="display-5 fw-bold text-success">Order Confirmed!</h1>
            <p className="lead text-muted">
              Thank you for your order. We've received your order and will
              process it shortly.
            </p>
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
                Order Details
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-bold">Order Number</h6>
                  <p className="text-muted">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>

                  <h6 className="fw-bold">Order Date</h6>
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
                  <h6 className="fw-bold">Order Status</h6>
                  <span
                    className={`badge bg-${getStatusColor(order.status)} fs-6`}
                  >
                    <i
                      className={`fas ${getStatusIcon(order.status)} me-1`}
                    ></i>
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>

                  <h6 className="fw-bold mt-3">Payment Method</h6>
                  <p className="text-muted">
                    <i
                      className={`fas ${
                        order.paymentMethod === "telebirr"
                          ? "fa-mobile-alt"
                          : "fab fa-paypal"
                      } me-2`}
                    ></i>
                    {order.paymentMethod === "telebirr" ? "Telebirr" : "PayPal"}
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
                Shipping Address
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
                Order Items
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
                      <span className="text-muted">Qty: {item.quantity}</span>
                    </div>
                    <div className="col-md-2 text-end">
                      <span className="fw-bold">
                        ${(item.price * item.quantity).toFixed(2)}
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
              <h5 className="mb-0">Order Summary</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Tax (10%)</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">Free</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <span className="h5 fw-bold">Total</span>
                <span className="h5 fw-bold text-primary">
                  ${order.total.toFixed(2)}
                </span>
              </div>

              {order.notes && (
                <div className="mb-3">
                  <h6 className="fw-bold">Order Notes</h6>
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      Download Receipt
                    </>
                  )}
                </button>
                <Link to="/products" className="btn btn-primary">
                  <i className="fas fa-shopping-bag me-2"></i>
                  Continue Shopping
                </Link>
                <Link to="/profile" className="btn btn-outline-primary">
                  <i className="fas fa-user me-2"></i>
                  View Profile
                </Link>
              </div>

              <div className="mt-4 text-center">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  You will receive an email confirmation shortly.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
