import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../api/orderApi";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrder(orderId);
        setOrder(orderData);
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

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
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
                <Link to="/profile" className="btn btn-primary mt-3">
                  Back to Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: "pending", label: "Pending", icon: "fa-shopping-cart" },
    { key: "paid", label: "Payment Verified", icon: "fa-money-bill" },
    { key: "processing", label: "Processing", icon: "fa-box-open" },
    { key: "shipped", label: "Shipped", icon: "fa-shipping-fast" },
    { key: "completed", label: "Completed", icon: "fa-check-double" },
  ];

  const cancelledSteps = [
    { key: "pending", label: "Order Placed", icon: "fa-shopping-cart" },
    { key: "cancelled", label: "Cancelled", icon: "fa-times-circle" },
  ];

  const isCancelled = order.status === "cancelled";
  const steps = isCancelled ? cancelledSteps : statusSteps;

  const getCurrentStepIndex = () => {
    if (isCancelled) return 1;
    const index = steps.findIndex((s) => s.key === order.status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

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

  return (
    <div className="container mt-4 mb-5">
      <div className="row mb-4">
        <div className="col-12">
          <Link to="/profile" className="text-decoration-none">
            <i className="fas fa-arrow-left me-2"></i>Back to Orders
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Order Tracking</h4>
                  <small className="text-muted">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </small>
                </div>
                <span
                  className={`badge bg-${getStatusColor(order.status)} fs-6`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="card-body">
              {/* Progress Timeline */}
              <div className="position-relative">
                <div
                  className="progress"
                  style={{
                    height: "4px",
                    position: "absolute",
                    top: "30px",
                    left: "0",
                    right: "0",
                    zIndex: 0,
                  }}
                >
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${
                        (currentStepIndex / (steps.length - 1)) * 100
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="row position-relative" style={{ zIndex: 1 }}>
                  {steps.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.key} className="col text-center">
                        <div
                          className={`mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center ${
                            isActive
                              ? isCurrent
                                ? `bg-${getStatusColor(order.status)}`
                                : "bg-success"
                              : "bg-light border border-2"
                          }`}
                          style={{
                            width: "60px",
                            height: "60px",
                            color: isActive ? "#fff" : "#6c757d",
                          }}
                        >
                          <i
                            className={`fas ${step.icon} ${
                              isActive ? "" : "text-muted"
                            }`}
                          ></i>
                        </div>
                        <div
                          className={`fw-semibold ${
                            isActive ? "text-dark" : "text-muted"
                          }`}
                        >
                          {step.label}
                        </div>
                        {isCurrent && (
                          <small className="text-muted d-block mt-1">
                            Current Status
                          </small>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>Order Items
              </h5>
            </div>
            <div className="card-body p-0">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="border-bottom p-3 d-flex align-items-center"
                >
                  <img
                    src={item.product?.images?.[0] || item.image}
                    alt={item.name || item.product?.name}
                    className="rounded me-3"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.name || item.product?.name}</h6>
                    <p className="text-muted small mb-0">
                      Quantity: {item.quantity} × ETB{" "}
                      {item.price?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="text-end">
                    <strong className="text-primary">
                      ETB{" "}
                      {(
                        (item.price || 0) * (item.quantity || 1)
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>Shipping Address
              </h5>
            </div>
            <div className="card-body">
              <address className="mb-0">
                <strong>
                  {order.shippingAddress?.firstName}{" "}
                  {order.shippingAddress?.lastName}
                </strong>
                <br />
                {order.shippingAddress?.address}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                {order.shippingAddress?.zipCode}
                <br />
                {order.shippingAddress?.country}
                <br />
                <i className="fas fa-phone me-1"></i>{" "}
                {order.shippingAddress?.phone}
              </address>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className="card border-0 shadow-sm sticky-top"
            style={{ top: "20px" }}
          >
            <div className="card-header bg-white">
              <h5 className="mb-0">Order Summary</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
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
                  <span>Tax</span>
                  <span>ETB {order.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span className="text-success">
                  {order.shipping === 0 ? "Free" : `ETB ${order.shipping}`}
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span className="h5 fw-bold">Total</span>
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

              <div className="mb-3">
                <h6 className="fw-bold">Payment Method</h6>
                <p className="text-muted mb-0">
                  <i
                    className={`fas ${
                      order.paymentMethod === "telebirr"
                        ? "fa-mobile-alt"
                        : "fab fa-paypal"
                    } me-2`}
                  ></i>
                  {order.paymentMethod === "telebirr" ? "Telebirr" : "PayPal"}
                </p>
                {order.paymentDetails?.transactionId && (
                  <small className="text-muted">
                    Txn: {order.paymentDetails.transactionId}
                  </small>
                )}
              </div>

              <div className="d-grid gap-2">
                <Link
                  to={`/order-confirmation/${order._id}`}
                  className="btn btn-orange"
                >
                  <i className="fas fa-receipt me-2"></i>View Receipt
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
