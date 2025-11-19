import React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminOverview,
  fetchAdminRecentOrders,
  fetchAdminTopProducts,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminOrders,
  updateOrderStatus,
  verifyTelebirr,
  fetchSellers,
  updateSellerStatus,
  fetchSellerStats,
  fetchDisputes,
  updateDisputeStatus,
} from "../api/adminApi";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminBrands from "./AdminBrands";
import Sparkline from "../components/Sparkline";
import CountUp from "../components/CountUp";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [verifyBusy, setVerifyBusy] = useState([]); // orderIds being verified
  const [sellers, setSellers] = useState([]);
  const [sellersFilter, setSellersFilter] = useState("pending"); // pending|approved|rejected|all
  const [expandedSellers, setExpandedSellers] = useState(new Set());
  const [sellerStats, setSellerStats] = useState({}); // { sellerId: { products, orders, revenue } }
  const [loadingStats, setLoadingStats] = useState(new Set());
  const [disputes, setDisputes] = useState([]);
  const [disputeFilter, setDisputeFilter] = useState("open"); // open|accepted|rejected|resolved|all

  const adminStatusOptions = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];

  const statusOrderIndex = (status) =>
    adminStatusOptions.indexOf(status ?? "pending");

  const isOrderLocked = (status) =>
    status === "completed" || status === "cancelled";

  const isAdminOptionDisabled = (current, option) => {
    if (option === current) return false;
    if (isOrderLocked(current)) return true;
    if (option === "cancelled" && current === "completed") return true;
    const currentIndex = statusOrderIndex(current);
    const optionIndex = statusOrderIndex(option);
    if (optionIndex === -1) return true;
    return optionIndex < currentIndex;
  };

  const formatStatusLabel = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [ov, rec, top, us, ord] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminRecentOrders(5),
          fetchAdminTopProducts(5),
          fetchAdminUsers(),
          fetchAdminOrders(),
        ]);
        if (!mounted) return;
        setOverview(ov);
        setRecentOrders(rec);
        setTopProducts(top);
        setUsers(us);
        setOrders(ord);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load dashboard"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load sellers when Sellers tab becomes active or filter changes
  useEffect(() => {
    let mounted = true;
    async function loadSellers() {
      if (activeTab !== "sellers") return;
      try {
        const status = sellersFilter === "all" ? undefined : sellersFilter;
        const list = await fetchSellers(status);
        if (!mounted) return;
        setSellers(list);
      } catch (e) {
        // ignore for UX
      }
    }
    loadSellers();
    return () => {
      mounted = false;
    };
  }, [activeTab, sellersFilter]);

  useEffect(() => {
    let mounted = true;
    async function loadDisputes() {
      if (activeTab !== "disputes") return;
      try {
        const statusParam = disputeFilter === "all" ? undefined : disputeFilter;
        const data = await fetchDisputes(statusParam);
        if (!mounted) return;
        setDisputes(data);
      } catch (e) {
        console.error("Failed to load disputes:", e);
      }
    }
    loadDisputes();
    return () => {
      mounted = false;
    };
  }, [activeTab, disputeFilter]);

  const onSellerStatus = async (userId, status) => {
    try {
      await updateSellerStatus(userId, status);
      // refresh current list
      const statusFilter = sellersFilter === "all" ? undefined : sellersFilter;
      const list = await fetchSellers(statusFilter);
      setSellers(list);
    } catch (e) {
      // noop
    }
  };

  const toggleSellerExpanded = async (sellerId) => {
    const newSet = new Set(expandedSellers);
    if (newSet.has(sellerId)) {
      newSet.delete(sellerId);
    } else {
      newSet.add(sellerId);
      // Load stats if not already loaded
      if (!sellerStats[sellerId] && !loadingStats.has(sellerId)) {
        setLoadingStats((prev) => new Set(prev).add(sellerId));
        try {
          const stats = await fetchSellerStats(sellerId);
          setSellerStats((prev) => ({ ...prev, [sellerId]: stats }));
        } catch (e) {
          console.error("Failed to load seller stats:", e);
        } finally {
          setLoadingStats((prev) => {
            const next = new Set(prev);
            next.delete(sellerId);
            return next;
          });
        }
      }
    }
    setExpandedSellers(newSet);
  };

  const handleDisputeAction = async (disputeId, status, extra = {}) => {
    try {
      await updateDisputeStatus(disputeId, { status, ...extra });
      const statusParam = disputeFilter === "all" ? undefined : disputeFilter;
      const data = await fetchDisputes(statusParam);
      setDisputes(data);
    } catch (err) {
      console.error("Failed to update dispute:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to update dispute. Please try again."
      );
    }
  };

  // Derive fallback series/trends if backend doesn't supply them
  const derived = useMemo(() => {
    const totals = overview?.totals || {};
    const backendSeries = overview?.series || {};
    const backendTrends = overview?.trends || {};

    // Build last 7 days buckets
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    // Orders per day
    const seriesOrders =
      backendSeries.orders ||
      days.map(
        (day) =>
          recentOrders.filter((o) => isSameDay(new Date(o.createdAt), day))
            .length
      );

    // Revenue per day (ETB)
    const seriesRevenue =
      backendSeries.revenue ||
      days.map((day) => {
        return recentOrders
          .filter((o) => isSameDay(new Date(o.createdAt), day))
          .reduce(
            (sum, o) => sum + (o.totalPrice ?? o.total ?? o.amount ?? 0),
            0
          );
      });

    // Simple synthetic series for products/users if not provided
    const synthSeries = (value) => {
      const v = Number(value || 0);
      if (!v) return [0, 0, 0, 0, 0, 0, 0];
      // create a gentle ramp towards current value
      const base = Math.max(0, Math.floor(v * 0.8));
      const step = Math.max(1, Math.floor((v - base) / 6));
      return Array.from({ length: 7 }, (_, i) => base + step * i);
    };

    const seriesProducts =
      backendSeries.products || synthSeries(totals.products);
    const seriesUsers = backendSeries.users || synthSeries(totals.users);

    const calcTrend = (series) => {
      if (!Array.isArray(series) || series.length < 2) return 0;
      const first = Number(series[0] || 0);
      const last = Number(series[series.length - 1] || 0);

      // If first value is 0 or very small, handle differently
      if (first === 0 || first < 0.01) {
        // If we went from 0 to a value, show 100% increase
        // If we went from 0 to 0, show 0%
        return last > 0 ? 100 : 0;
      }

      // Normal percentage calculation: ((new - old) / old) * 100
      const change = ((last - first) / first) * 100;

      // Cap at reasonable maximum (e.g., 10000% = 100x increase)
      return Math.min(change, 10000);
    };

    const trends = {
      products: backendTrends.products ?? calcTrend(seriesProducts),
      users: backendTrends.users ?? calcTrend(seriesUsers),
      orders: backendTrends.orders ?? calcTrend(seriesOrders),
      revenue: backendTrends.revenue ?? calcTrend(seriesRevenue),
    };

    const series = {
      products: seriesProducts,
      users: seriesUsers,
      orders: seriesOrders,
      revenue: seriesRevenue,
    };

    return { totals, trends, series };
  }, [overview, recentOrders, users]);

  const getDisputeBadgeClass = (status) => {
    switch (status) {
      case "accepted":
        return "success";
      case "rejected":
        return "danger";
      case "resolved":
        return "primary";
      default:
        return "warning text-dark";
    }
  };

  // Initialize Bootstrap tooltips when activeTab changes (and on mount)
  useEffect(() => {
    try {
      const w = window;
      if (w && w.bootstrap && w.bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.forEach((el) => new w.bootstrap.Tooltip(el));
      }
    } catch {}
  }, [activeTab, overview]);

  return (
    <div className="container py-3">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="d-flex align-items-center mb-3">
        <h3 className="mb-0">Admin Dashboard</h3>
        <span className="ms-2 badge badge-orange">MegaMart</span>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-3">
        {[
          { key: "overview", label: "Overview", icon: "fa-chart-line" },
          { key: "users", label: "Users", icon: "fa-users" },
          { key: "sellers", label: "Sellers", icon: "fa-store" },
          { key: "orders", label: "Orders", icon: "fa-file-invoice" },
          {
            key: "disputes",
            label: "Disputes",
            icon: "fa-exclamation-triangle",
          },
          { key: "products", label: "Products", icon: "fa-box" },
          { key: "categories", label: "Categories", icon: "fa-tags" },
          { key: "brands", label: "Brands", icon: "fa-bookmark" },
        ].map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <i className={`fas ${t.icon} me-2`}></i>
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "sellers" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Seller Approvals</strong>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 small text-muted">Filter</label>
              <select
                className="form-select"
                style={{ width: 160 }}
                value={sellersFilter}
                onChange={(e) => setSellersFilter(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            {sellers.length === 0 ? (
              <div className="text-muted">No sellers found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "30px" }}></th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Shop</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((u) => {
                      const isExpanded = expandedSellers.has(u._id);
                      const stats = sellerStats[u._id];
                      const isLoadingStats = loadingStats.has(u._id);
                      return (
                        <React.Fragment key={u._id}>
                          <tr
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleSellerExpanded(u._id)}
                          >
                            <td>
                              <i
                                className={`fas fa-chevron-${
                                  isExpanded ? "down" : "right"
                                } text-muted`}
                              ></i>
                            </td>
                            <td>
                              <div className="fw-bold">
                                {u.displayName ||
                                  u.email?.split("@")[0] ||
                                  "User"}
                              </div>
                              {u.displayName && (
                                <small className="text-muted d-block">
                                  {u.email}
                                </small>
                              )}
                            </td>
                            <td>
                              {!u.displayName ? (
                                <span className="text-muted">-</span>
                              ) : (
                                u.email
                              )}
                            </td>
                            <td>
                              <span className="badge text-bg-light">
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge text-uppercase ${
                                  u.sellerStatus === "approved"
                                    ? "bg-success"
                                    : u.sellerStatus === "pending"
                                    ? "bg-warning text-dark"
                                    : u.sellerStatus === "rejected"
                                    ? "bg-danger"
                                    : "badge-orange"
                                }`}
                              >
                                {u.sellerStatus || "none"}
                              </span>
                            </td>
                            <td>
                              {u.sellerProfile?.shopName ? (
                                u.sellerProfile.shopName
                              ) : (
                                <span className="text-muted small">
                                  <i className="fas fa-exclamation-circle me-1"></i>
                                  Not provided
                                </span>
                              )}
                            </td>
                            <td>
                              {u.sellerProfile?.phone ? (
                                u.sellerProfile.phone
                              ) : (
                                <span className="text-muted small">
                                  <i className="fas fa-exclamation-circle me-1"></i>
                                  Not provided
                                </span>
                              )}
                            </td>
                            <td
                              className="d-flex gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() =>
                                  onSellerStatus(u._id, "approved")
                                }
                                disabled={u.sellerStatus === "approved"}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-outline-warning btn-sm"
                                onClick={() => onSellerStatus(u._id, "pending")}
                                disabled={u.sellerStatus === "pending"}
                              >
                                Pending
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  onSellerStatus(u._id, "rejected")
                                }
                                disabled={u.sellerStatus === "rejected"}
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div className="p-3 bg-light">
                                  <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                      <h6 className="mb-3">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Seller Details
                                      </h6>
                                      <div className="mb-2">
                                        <strong>Shop Name:</strong>{" "}
                                        {u.sellerProfile?.shopName || "N/A"}
                                      </div>
                                      <div className="mb-2">
                                        <strong>Phone:</strong>{" "}
                                        {u.sellerProfile?.phone || "N/A"}
                                      </div>
                                      <div className="mb-2">
                                        <strong>Description:</strong>{" "}
                                        {u.sellerProfile?.description ||
                                          "No description"}
                                      </div>
                                      <div className="mb-2">
                                        <strong>Applied:</strong>{" "}
                                        {new Date(
                                          u.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                      <h6 className="mb-3">
                                        <i className="fas fa-chart-bar me-2"></i>
                                        Performance Stats
                                      </h6>
                                      {isLoadingStats ? (
                                        <div className="text-center py-3">
                                          <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                          >
                                            <span className="visually-hidden">
                                              Loading...
                                            </span>
                                          </div>
                                        </div>
                                      ) : stats ? (
                                        <div className="row g-2">
                                          <div className="col-6">
                                            <div className="p-2 bg-white rounded border">
                                              <div className="text-muted small">
                                                Products
                                              </div>
                                              <div className="h5 mb-0">
                                                {stats.products || 0}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-6">
                                            <div className="p-2 bg-white rounded border">
                                              <div className="text-muted small">
                                                Orders
                                              </div>
                                              <div className="h5 mb-0">
                                                {stats.orders || 0}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-12">
                                            <div className="p-2 bg-white rounded border">
                                              <div className="text-muted small">
                                                Total Revenue
                                              </div>
                                              <div className="h5 mb-0 text-success">
                                                ETB{" "}
                                                {Number(
                                                  stats.revenue || 0
                                                ).toLocaleString()}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-muted">
                                          No stats available
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            {[
              {
                label: "Total Products",
                value: overview?.totals?.products ?? 0,
                icon: "fa-boxes-stacked",
                cls: "kpi-apricot",
                key: "products",
              },
              {
                label: "Total Users",
                value: overview?.totals?.users ?? 0,
                icon: "fa-users",
                cls: "kpi-amber",
                key: "users",
              },
              {
                label: "Total Orders",
                value: overview?.totals?.orders ?? 0,
                icon: "fa-cart-shopping",
                cls: "kpi-coral",
                key: "orders",
              },
              {
                label: "Total Revenue",
                value: overview?.totals?.revenue ?? 0,
                icon: "fa-sack-dollar",
                cls: "kpi-orange",
                key: "revenue",
                format: "currency",
              },
              {
                label: "Commission Earned",
                value: overview?.totals?.commission ?? 0,
                icon: "fa-piggy-bank",
                cls: "kpi-apricot",
                key: "commission",
                format: "currency",
              },
            ].map((kpi, idx) => (
              <div className="col-12 col-md-6 col-lg-3" key={idx}>
                <div className={`kpi-card ${kpi.cls}`}>
                  <div className="kpi-top">
                    <span className="kpi-icon">
                      <i className={`fas ${kpi.icon}`}></i>
                    </span>
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">{kpi.label}</div>
                    <div className="d-flex align-items-baseline justify-content-between">
                      <div className="kpi-value">
                        {kpi.format === "currency" ? (
                          <>
                            ETB <CountUp value={Number(kpi.value) || 0} />
                          </>
                        ) : (
                          <CountUp value={Number(kpi.value) || 0} />
                        )}
                      </div>
                      <div className="ms-2 small d-flex align-items-center">
                        {(() => {
                          const trend =
                            overview?.trends?.[kpi.key] ??
                            derived.trends[kpi.key];
                          if (typeof trend !== "number") return null;
                          const up = trend >= 0;
                          return (
                            <span
                              className={
                                (up ? "text-success" : "text-danger") +
                                " trend-anim"
                              }
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Change in last 7 days"
                            >
                              <i
                                className={`fas ${
                                  up ? "fa-arrow-up" : "fa-arrow-down"
                                } me-1`}
                              />
                              {Math.abs(trend).toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div
                      className="small opacity-75"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="KPI shows current total; sparkline shows last 7 days"
                    >
                      <i className="fas fa-info-circle me-1"></i>
                      Last 7 days
                    </div>
                    <div className="mt-2">
                      {(() => {
                        const series =
                          overview?.series?.[kpi.key] ??
                          derived.series[kpi.key];
                        if (!Array.isArray(series) || series.length === 0)
                          return null;
                        return <Sparkline data={series} />;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3">
            {/* Recent Orders */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <strong>Recent Orders</strong>
                </div>
                <div className="card-body">
                  {loading && <div className="text-muted">Loading...</div>}
                  {!loading && recentOrders.length === 0 && (
                    <div className="text-muted">No recent orders</div>
                  )}
                  {!loading && recentOrders.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((o) => (
                            <tr key={o._id}>
                              <td className="text-muted">
                                #{String(o.orderNo || o._id).slice(-6)}
                              </td>
                              <td>{o.user?.email || "-"}</td>
                              <td>
                                ETB{" "}
                                {(
                                  o.totalPrice ??
                                  o.total ??
                                  o.amount ??
                                  0
                                ).toLocaleString()}
                              </td>
                              <td>
                                <span className="badge badge-orange text-uppercase">
                                  {o.status}
                                </span>
                              </td>
                              <td>
                                {new Date(o.createdAt).toLocaleDateString()}
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

            {/* Top Products */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <strong>Top Products</strong>
                </div>
                <div className="card-body">
                  {loading && <div className="text-muted">Loading...</div>}
                  {!loading && topProducts.length === 0 && (
                    <div className="text-muted">No products</div>
                  )}
                  {!loading && topProducts.length > 0 && (
                    <ul className="list-group list-group-flush">
                      {topProducts.map((p, i) => (
                        <li
                          key={p._id || i}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">{p.name}</div>
                            <div className="text-muted small">
                              Price: ETB{" "}
                              {p.price?.toLocaleString?.() || p.price}
                            </div>
                          </div>
                          <span className="badge rounded-pill bg-success-subtle text-success">
                            Stock: {p.stock ?? "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="row g-3 mt-1">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <strong>Low Stock Alerts</strong>
                  <span className="text-muted small">Threshold: ≤ 5</span>
                </div>
                <div className="card-body">
                  {(() => {
                    const low = (topProducts || []).filter(
                      (p) => typeof p.stock === "number" && p.stock <= 5
                    );
                    if (loading)
                      return <div className="text-muted">Loading...</div>;
                    if (low.length === 0)
                      return (
                        <div className="text-muted">
                          No low-stock items detected
                        </div>
                      );
                    return (
                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Stock</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {low.map((p) => (
                              <tr key={p._id}>
                                <td className="fw-semibold">{p.name}</td>
                                <td>
                                  <span className="badge bg-danger-subtle text-danger">
                                    {p.stock}
                                  </span>
                                </td>
                                <td>
                                  <a
                                    href="#products"
                                    className="btn btn-sm btn-orange"
                                  >
                                    Restock
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>User Management</strong>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="fw-semibold">
                        {u.email?.split("@")[0] || "User"}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          className="form-select form-select-sm w-auto"
                          value={u.role}
                          onChange={async (e) => {
                            const next = e.target.value;
                            const updated = await updateUserRole(u._id, next);
                            setUsers((list) =>
                              list.map((x) =>
                                x._id === u._id
                                  ? { ...x, role: updated.role }
                                  : x
                              )
                            );
                          }}
                        >
                          <option value="user">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Order Management</strong>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Telebirr Txn</th>
                    <th>Verify</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className="text-muted">#{String(o._id).slice(-6)}</td>
                      <td>{o.user?.email || "-"}</td>
                      <td>
                        ETB{" "}
                        {(
                          o.totalPrice ??
                          o.total ??
                          o.amount ??
                          0
                        ).toLocaleString()}
                      </td>
                      <td>{o.paymentDetails?.transactionId || "-"}</td>
                      <td>
                        {o.paymentDetails?.verifiedByAdmin ? (
                          <span className="badge bg-success">
                            <i className="fas fa-check me-1"></i> Verified
                          </span>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            disabled={
                              !o.paymentDetails?.transactionId ||
                              verifyBusy.includes(o._id)
                            }
                            onClick={async () => {
                              try {
                                setVerifyBusy((ids) => [...ids, o._id]);
                                const response = await verifyTelebirr(o._id);
                                const updatedOrder =
                                  response?.order || response;
                                setOrders((list) =>
                                  list.map((x) =>
                                    x._id === o._id
                                      ? { ...x, ...updatedOrder }
                                      : x
                                  )
                                );
                              } catch (e) {
                                console.error("Telebirr verify failed", e);
                              } finally {
                                setVerifyBusy((ids) =>
                                  ids.filter((id) => id !== o._id)
                                );
                              }
                            }}
                            title="Verify Telebirr transaction"
                          >
                            {verifyBusy.includes(o._id) ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check me-1"></i>
                                Verify
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm w-auto"
                          value={o.status}
                          onChange={async (e) => {
                            const next = e.target.value;
                            if (
                              next === o.status ||
                              isAdminOptionDisabled(o.status, next)
                            ) {
                              return;
                            }
                            const updated = await updateOrderStatus(
                              o._id,
                              next
                            );
                            setOrders((list) =>
                              list.map((x) =>
                                x._id === o._id ? { ...x, ...updated } : x
                              )
                            );
                          }}
                        >
                          {adminStatusOptions.map((s) => (
                            <option
                              key={s}
                              value={s}
                              disabled={isAdminOptionDisabled(o.status, s)}
                            >
                              {formatStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Order Disputes</strong>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 small text-muted">Filter</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 180 }}
                value={disputeFilter}
                onChange={(e) => setDisputeFilter(e.target.value)}
              >
                <option value="open">Open</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="resolved">Resolved</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            {disputes.length === 0 ? (
              <div className="text-muted">No disputes found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Buyer</th>
                      <th>Seller</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((d) => (
                      <tr key={d._id}>
                        <td>
                          #{String(d.order?._id || d.order).slice(-6)}
                          <div className="text-muted small">
                            {d.order?.status || "—"}
                          </div>
                        </td>
                        <td>{d.buyer?.email || "Unknown"}</td>
                        <td>{d.seller?.email || "Multiple sellers"}</td>
                        <td>
                          <strong>{d.reason}</strong>
                          {d.details && (
                            <div className="text-muted small mt-1">
                              {d.details}
                            </div>
                          )}
                          {d.resolution && (
                            <div className="text-success small mt-1">
                              Resolution: {d.resolution}
                            </div>
                          )}
                          {d.adminNotes && (
                            <div className="text-muted small mt-1">
                              Admin Notes: {d.adminNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge bg-${getDisputeBadgeClass(
                              d.status
                            )}`}
                          >
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(d.createdAt).toLocaleString()}</td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                            {d.status !== "accepted" && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => {
                                  const message = window.prompt(
                                    "Message to buyer (optional):",
                                    ""
                                  );
                                  handleDisputeAction(d._id, "accepted", {
                                    message: message ?? "",
                                  });
                                }}
                              >
                                Accept
                              </button>
                            )}
                            {d.status !== "rejected" && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  const message = window.prompt(
                                    "Message to buyer (optional):",
                                    ""
                                  );
                                  handleDisputeAction(d._id, "rejected", {
                                    message: message ?? "",
                                  });
                                }}
                              >
                                Reject
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                const resolution = window.prompt(
                                  "Enter resolution/notes for this dispute:",
                                  d.resolution || ""
                                );
                                if (resolution !== null) {
                                  const message = window.prompt(
                                    "Message to buyer (optional):",
                                    ""
                                  );
                                  handleDisputeAction(d._id, "resolved", {
                                    resolution,
                                    message: message ?? "",
                                  });
                                }
                              }}
                            >
                              Resolve
                            </button>
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
      )}

      {activeTab === "products" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Product Management</strong>
          </div>
          <div className="card-body p-0">
            <AdminProducts />
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Categories</strong>
          </div>
          <div className="card-body p-0">
            <AdminCategories />
          </div>
        </div>
      )}

      {activeTab === "brands" && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Brands</strong>
          </div>
          <div className="card-body p-0">
            <AdminBrands />
          </div>
        </div>
      )}
    </div>
  );
}
