import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserOrders } from "../api/orderApi";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const userOrders = await getUserOrders();
        setOrders(userOrders);
      } catch (err) {
        setError("Failed to load order history");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "confirmed":
      case "paid":
        return "info";
      case "shipped":
        return "primary";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "✅";
      case "pending":
        return "⏳";
      case "confirmed":
        return "✓";
      case "paid":
        return "💰";
      case "shipped":
        return "🚚";
      case "cancelled":
        return "❌";
      default:
        return "📦";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning text-center">
              <h4>🔒 Authentication Required</h4>
              <p>Please log in to view your profile.</p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Profile Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="avatar-circle me-3">
                      <i className="fas fa-user"></i>
                    </div>
                    <div>
                      <h2 className="mb-1">👋 Welcome back!</h2>
                      <p className="text-muted mb-0">
                        {profile?.displayName ||
                          user.email?.split("@")[0] ||
                          "User"}
                      </p>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2 justify-content-md-end">
                      {profile?.role === "admin" && (
                        <span className="badge bg-danger fs-6">👑 Admin</span>
                      )}
                      {profile?.role === "seller" &&
                        profile?.sellerStatus === "approved" && (
                          <span className="badge bg-success fs-6">
                            🏪 Seller
                          </span>
                        )}
                      {profile?.sellerStatus === "pending" && (
                        <span className="badge bg-warning text-dark fs-6">
                          ⏳ Seller Pending
                        </span>
                      )}
                      {profile?.sellerStatus === "rejected" && (
                        <span className="badge bg-danger fs-6">
                          ❌ Seller Rejected
                        </span>
                      )}
                      {(!profile?.role || profile?.role === "buyer") &&
                        !profile?.sellerStatus && (
                          <span className="badge bg-primary fs-6">
                            👤 Buyer
                          </span>
                        )}
                    </div>
                    <small className="text-muted">
                      Member since{" "}
                      {new Date(user.metadata.creationTime).getFullYear()}
                    </small>
                    {profile?.sellerProfile?.shopName && (
                      <small className="text-muted">
                        Shop: {profile.sellerProfile.shopName}
                      </small>
                    )}
                    {(profile?.role === "seller" || profile?.sellerStatus) && (
                      <Link
                        to="/seller"
                        className="btn btn-sm btn-success mt-2"
                      >
                        <i className="fas fa-store me-1"></i>
                        {profile?.sellerStatus === "approved"
                          ? "Go to Seller Dashboard"
                          : "View Seller Application"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="text-primary mb-2">
                <i className="fas fa-shopping-bag fa-2x"></i>
              </div>
              <h4 className="mb-1">{orders.length}</h4>
              <p className="text-muted mb-0">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="text-success mb-2">
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
              <h4 className="mb-1">
                {
                  orders.filter(
                    (order) =>
                      order.status === "completed" ||
                      order.status === "delivered"
                  ).length
                }
              </h4>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="text-warning mb-2">
                <i className="fas fa-clock fa-2x"></i>
              </div>
              <h4 className="mb-1">
                {
                  orders.filter(
                    (order) =>
                      order.status === "pending" ||
                      order.status === "confirmed" ||
                      order.status === "paid" ||
                      order.status === "shipped"
                  ).length
                }
              </h4>
              <p className="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="text-info mb-2">
                <i className="fas fa-dollar-sign fa-2x"></i>
              </div>
              <h4 className="mb-1">
                ETB{" "}
                {orders
                  .reduce(
                    (total, order) =>
                      total +
                      (order.totalPrice || order.total || order.amount || 0),
                    0
                  )
                  .toLocaleString()}
              </h4>
              <p className="text-muted mb-0">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h4 className="mb-0">📦 Order History</h4>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading your orders...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <i className="fas fa-shopping-bag fa-3x"></i>
                  </div>
                  <h5>No orders yet</h5>
                  <p className="text-muted">
                    Start shopping to see your orders here!
                  </p>
                  <Link to="/products" className="btn btn-primary">
                    <i className="fas fa-shopping-cart me-2"></i>
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Dispute</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <code className="text-primary">
                              #{order._id.slice(-8).toUpperCase()}
                            </code>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(order.createdAt)}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {order.items.length} item
                              {order.items.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            <strong className="text-primary">
                              ETB{" "}
                              {(
                                order.totalPrice ||
                                order.total ||
                                order.amount ||
                                0
                              ).toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`badge bg-${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusIcon(order.status)}{" "}
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {order.dispute ? (
                              <span
                                className={`badge bg-${
                                  order.dispute.status === "resolved"
                                    ? "primary"
                                    : order.dispute.status === "rejected"
                                    ? "danger"
                                    : order.dispute.status === "accepted"
                                    ? "success"
                                    : "warning text-dark"
                                }`}
                              >
                                {order.dispute.status.toUpperCase()}
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted">
                                None
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link
                                to={`/order-tracking/${order._id}`}
                                className="btn btn-sm btn-orange"
                              >
                                <i className="fas fa-truck me-1"></i>
                                Track
                              </Link>
                              <Link
                                to={`/order-confirmation/${order._id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="fas fa-eye me-1"></i>
                                View
                              </Link>
                              <Link
                                to={`/orders/${order._id}/contact`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                <i className="fas fa-comments me-1"></i>
                                Contact Seller
                              </Link>
                              {order.status !== "completed" &&
                                order.status !== "delivered" && (
                                  <Link
                                    to={`/disputes/new/${order._id}`}
                                    className="btn btn-sm btn-outline-danger"
                                  >
                                    <i className="fas fa-exclamation-circle me-1"></i>
                                    Raise Dispute
                                  </Link>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
