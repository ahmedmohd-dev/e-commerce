import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  applyForSeller,
  fetchMyOrders,
  updateItemShippingStatus,
  updateOrderStatus,
  fetchSellerOverview,
  fetchSellerRecentOrders,
  fetchSellerTopProducts,
  fetchMyContactThreads,
  fetchContactThread,
  replyToContactThread,
} from "../api/sellerApi";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";
import http from "../api/http";
import { fetchCategories } from "../api/categoryApi";
import { fetchBrands } from "../api/brandApi";
import CountUp from "../components/CountUp";
import Sparkline from "../components/Sparkline";

export default function SellerDashboard() {
  const { role, sellerStatus, loading, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | products | orders | messages
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [orders, setOrders] = useState({
    items: [],
    page: 1,
    pages: 1,
    total: 0,
  });
  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: 0,
    description: "",
    imagesText: "",
    category: "",
    brand: "",
    stock: 0,
    isActive: true,
  });
  const [editId, setEditId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [shippingBusy, setShippingBusy] = useState(new Set());
  const [orderStatusBusy, setOrderStatusBusy] = useState(new Set());
  const [showReapply, setShowReapply] = useState(false);
  const [contactThreads, setContactThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replying, setReplying] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const formRef = React.useRef(null);
  const canManage = role === "seller" && sellerStatus === "approved";

  const load = async (p = 1) => {
    setBusy(true);
    try {
      const data = await fetchMyProducts({ page: p, limit: 12, search });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch {
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    async function loadOverview() {
      if (!canManage || activeTab !== "overview") return;
      setOverviewLoading(true);
      try {
        const [ov, rec, top] = await Promise.all([
          fetchSellerOverview(),
          fetchSellerRecentOrders(5),
          fetchSellerTopProducts(5),
        ]);
        console.log("🔍 [Seller Dashboard] Overview data received:", ov);
        console.log("🔍 [Seller Dashboard] Totals:", ov?.totals);
        console.log("🔍 [Seller Dashboard] Products:", ov?.totals?.products);
        console.log("🔍 [Seller Dashboard] Orders:", ov?.totals?.orders);
        console.log(
          "🔍 [Seller Dashboard] Net Revenue:",
          ov?.totals?.netRevenue
        );
        console.log(
          "🔍 [Seller Dashboard] Gross Revenue:",
          ov?.totals?.grossRevenue
        );
        console.log(
          "🔍 [Seller Dashboard] Items Shipped:",
          ov?.totals?.itemsShipped
        );
        console.log(
          "🔍 [Seller Dashboard] Items Pending:",
          ov?.totals?.itemsPending
        );
        setOverview(ov);
        setRecentOrders(rec);
        setTopProducts(top);
      } catch (err) {
        console.error("❌ [Seller Dashboard] Failed to load overview:", err);
        console.error(
          "❌ [Seller Dashboard] Error details:",
          err.response?.data || err.message
        );
      } finally {
        setOverviewLoading(false);
      }
    }
    loadOverview();
  }, [canManage, activeTab]);

  useEffect(() => {
    async function loadThreads() {
      if (!canManage || activeTab !== "messages") return;
      setLoadingThreads(true);
      try {
        const threads = await fetchMyContactThreads();
        setContactThreads(threads || []);
      } catch (err) {
        console.error("Failed to load contact threads:", err);
      } finally {
        setLoadingThreads(false);
      }
    }
    loadThreads();
  }, [canManage, activeTab]);

  // Refresh thread when sending a reply (handled in form submit)

  useEffect(() => {
    if (canManage && activeTab === "products") {
      load(1);
      Promise.all([fetchCategories(http), fetchBrands(http)])
        .then(([cats, brs]) => {
          setCategoryOptions(cats);
          setBrandOptions(brs);
        })
        .catch(() => {});
    }
  }, [canManage, activeTab]);

  useEffect(() => {
    async function loadOrders(p = 1) {
      if (!canManage || activeTab !== "orders") return;
      setBusy(true);
      try {
        const data = await fetchMyOrders({ page: p, limit: 10 });
        setOrders(data);
      } finally {
        setBusy(false);
      }
    }
    loadOrders(1);
  }, [canManage, activeTab]);

  const reloadOrders = async (targetPage = orders.page) => {
    const data = await fetchMyOrders({ page: targetPage, limit: 10 });
    setOrders(data);
  };

  const onEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      price: p.price || 0,
      description: p.description || "",
      imagesText: (p.images || []).join(", "),
      category: p.category || "",
      brand: p.brand || "",
      stock: p.stock || 0,
      isActive: p.isActive !== false,
    });
    // Scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const onReset = () => {
    setEditId(null);
    setForm({
      name: "",
      slug: "",
      price: 0,
      description: "",
      imagesText: "",
      category: "",
      brand: "",
      stock: 0,
      isActive: true,
    });
    setSelectedFiles([]);
  };

  const onCreate = async () => {
    if (!canManage) return;
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        images: String(form.imagesText || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        category: form.category,
        brand: form.brand,
        isActive: form.isActive,
      };
      if (editId) {
        await updateMyProduct(editId, payload);
      } else {
        await createMyProduct(payload);
      }
      onReset();
      load(1);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id) => {
    if (!canManage) return;
    setBusy(true);
    try {
      await deleteMyProduct(id);
      load(page);
    } finally {
      setBusy(false);
    }
  };

  const toggleOrderExpanded = (orderId) => {
    const newSet = new Set(expandedOrders);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setExpandedOrders(newSet);
  };

  const handleMarkShipped = async (orderId, itemProductId) => {
    const key = `${orderId}-${itemProductId}`;
    setShippingBusy((prev) => new Set(prev).add(key));
    try {
      await updateItemShippingStatus(orderId, itemProductId, "shipped");
      await reloadOrders();
    } catch (err) {
      console.error("Failed to update shipping status:", err);
    } finally {
      setShippingBusy((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const setOrderBusy = (orderId, add) => {
    setOrderStatusBusy((prev) => {
      const next = new Set(prev);
      if (add) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      return next;
    });
  };

  // Payment verification is done by admin only

  const statusBadgeMap = {
    pending: "bg-secondary text-dark",
    paid: "bg-info text-dark",
    processing: "bg-primary",
    shipped: "bg-primary",
    completed: "bg-success",
    cancelled: "bg-danger",
  };

  const statusHelperText = {
    pending: "Waiting for admin to verify Telebirr payment.",
    paid: "Payment verified. Start processing when you are ready.",
    processing: "You can now prepare and ship this order.",
    shipped: "In transit. Mark delivered once buyer confirms.",
    completed: "Delivered. Status is locked.",
    cancelled: "Order cancelled by admin.",
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSellerActionState = (order) => {
    if (!order.paymentDetails?.verifiedByAdmin) {
      return {
        message: "Admin must verify payment before you can take action.",
        icon: "fas fa-lock",
      };
    }
    if (order.status === "paid") {
      return {
        nextStatus: "processing",
        label: "Start Processing",
        icon: "fas fa-play",
      };
    }
    if (order.status === "processing") {
      return {
        nextStatus: "shipped",
        label: "Mark as Shipped",
        icon: "fas fa-shipping-fast",
      };
    }
    if (order.status === "shipped") {
      return {
        nextStatus: "completed",
        label: "Mark as Delivered",
        icon: "fas fa-flag-checkered",
      };
    }
    if (order.status === "completed") {
      return {
        message: "Order is completed and locked.",
        icon: "fas fa-lock",
      };
    }
    if (order.status === "cancelled") {
      return {
        message: "Order was cancelled by admin.",
        icon: "fas fa-ban",
      };
    }
    return {
      message: "Admin controls this status. Please wait.",
      icon: "fas fa-user-shield",
    };
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setOrderBusy(orderId, true);
    try {
      await updateOrderStatus(orderId, { status });
      await reloadOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to update order status. Please try again."
      );
    } finally {
      setOrderBusy(orderId, false);
    }
  };

  if (loading) return null;

  // Debug: Log current status (remove in production)
  // console.log("Seller Dashboard Debug:", { role, sellerStatus, profileStatus: profile?.sellerStatus });

  // Show application status if not approved seller
  // This includes: buyers, pending sellers, rejected sellers
  // Use profile?.sellerStatus as fallback in case context hasn't updated
  const currentSellerStatus = sellerStatus || profile?.sellerStatus || "none";

  if (role !== "seller" || currentSellerStatus !== "approved") {
    return (
      <div className="container py-4">
        <h3 className="mb-3">Seller Program</h3>
        {currentSellerStatus === "pending" && (
          <div className="card border-warning">
            <div className="card-header bg-warning bg-opacity-10 d-flex align-items-center gap-2">
              <i className="fas fa-clock text-warning"></i>
              <strong>Application Pending Review</strong>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Your seller application is currently under review by our admin
                team. We'll notify you via email once a decision has been made.
              </p>
              {profile?.sellerProfile && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Shop Name:</strong>
                    <p className="text-muted mb-0">
                      {profile.sellerProfile.shopName || "N/A"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong>
                    <p className="text-muted mb-0">
                      {profile.sellerProfile.phone || "N/A"}
                    </p>
                  </div>
                  {profile.sellerProfile.description && (
                    <div className="col-12">
                      <strong>Description:</strong>
                      <p className="text-muted mb-0">
                        {profile.sellerProfile.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {currentSellerStatus === "none" && (
          <SellerApplyCard
            initialData={profile?.sellerProfile}
            onSuccess={() => window.location.reload()}
          />
        )}
        {currentSellerStatus === "rejected" && !showReapply && (
          <div className="card border-danger">
            <div className="card-header bg-danger bg-opacity-10 d-flex align-items-center gap-2">
              <i className="fas fa-times-circle text-danger"></i>
              <strong>Application Rejected</strong>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Unfortunately, your seller application was not approved at this
                time. You can re-apply by submitting a new application with
                additional information.
              </p>
              {profile?.sellerProfile && (
                <div className="card border-info mb-3">
                  <div className="card-header bg-info bg-opacity-10">
                    <strong>
                      <i className="fas fa-file-alt me-2"></i>Your Rejected
                      Application Details
                    </strong>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <strong>Shop Name:</strong>
                        <p className="text-muted mb-0">
                          {profile.sellerProfile.shopName || "N/A"}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <strong>Phone Number:</strong>
                        <p className="text-muted mb-0">
                          {profile.sellerProfile.phone || "N/A"}
                        </p>
                      </div>
                      {profile.sellerProfile.description && (
                        <div className="col-12">
                          <strong>Description:</strong>
                          <p className="text-muted mb-0">
                            {profile.sellerProfile.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => setShowReapply(true)}
              >
                <i className="fas fa-redo me-2"></i>
                Re-apply as Seller
              </button>
            </div>
          </div>
        )}
        {currentSellerStatus === "rejected" && showReapply && (
          <div>
            <div className="alert alert-warning mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Please update your application details below. Make sure to provide
              complete and accurate information.
            </div>
            <SellerApplyCard
              initialData={profile?.sellerProfile}
              onSuccess={() => window.location.reload()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Seller Dashboard</h3>
        {activeTab === "products" && (
          <div className="d-flex gap-2">
            <input
              className="form-control"
              placeholder="Search my products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              style={{ width: 260 }}
            />
            <button
              className="btn btn-primary"
              onClick={() => load(1)}
              disabled={busy}
            >
              Search
            </button>
          </div>
        )}
      </div>

      <ul className="nav nav-pills mb-3">
        {[
          { key: "overview", label: "Overview", icon: "fa-chart-line" },
          { key: "products", label: "Products", icon: "fa-box" },
          { key: "orders", label: "Orders", icon: "fa-file-invoice" },
          { key: "messages", label: "Messages", icon: "fa-comments" },
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

      {activeTab === "overview" && (
        <div>
          {overviewLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : overview ? (
            <>
              {/* KPI Cards */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card border-0 shadow-sm kpi-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-muted small mb-1">
                            Total Products
                          </div>
                          <div className="h4 mb-0">
                            <CountUp value={overview.totals?.products || 0} />
                          </div>
                        </div>
                        <div className="kpi-icon" style={{ color: "#ff6b35" }}>
                          <i className="fas fa-box fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card border-0 shadow-sm kpi-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-muted small mb-1">
                            Total Orders
                          </div>
                          <div className="h4 mb-0">
                            <CountUp value={overview.totals?.orders || 0} />
                          </div>
                        </div>
                        <div className="kpi-icon" style={{ color: "#ff6b35" }}>
                          <i className="fas fa-shopping-cart fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card border-0 shadow-sm kpi-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-muted small mb-1">
                            Net Earnings
                          </div>
                          <div className="h4 mb-0">
                            ETB{" "}
                            <CountUp
                              value={
                                overview.totals?.netRevenue ??
                                overview.totals?.revenue ??
                                0
                              }
                            />
                          </div>
                          <div className="text-muted small mt-1">
                            Gross: ETB{" "}
                            {Number(
                              overview.totals?.grossRevenue ??
                                overview.totals?.revenue ??
                                0
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="kpi-icon" style={{ color: "#ff6b35" }}>
                          <i className="fas fa-dollar-sign fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card border-0 shadow-sm kpi-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-muted small mb-1">
                            Items Shipped
                          </div>
                          <div className="h4 mb-0">
                            <CountUp
                              value={overview.totals?.itemsShipped || 0}
                            />
                          </div>
                          <div className="text-muted small mt-1">
                            {overview.totals?.itemsPending || 0} pending
                          </div>
                        </div>
                        <div className="kpi-icon" style={{ color: "#ff6b35" }}>
                          <i className="fas fa-shipping-fast fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                {/* Recent Orders */}
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white">
                      <strong>Recent Orders</strong>
                    </div>
                    <div className="card-body">
                      {recentOrders.length === 0 ? (
                        <div className="text-muted">No recent orders</div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {recentOrders.map((o) => (
                            <div
                              key={o._id}
                              className="list-group-item px-0 d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <div className="fw-bold small">
                                  #{String(o._id).slice(-6)}
                                </div>
                                <div className="text-muted small">
                                  {o.user?.email || "-"}
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold">
                                  ETB {Number(o.subtotal || 0).toLocaleString()}
                                </div>
                                <span className="badge badge-orange">
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white">
                      <strong>Top Selling Products</strong>
                    </div>
                    <div className="card-body">
                      {topProducts.length === 0 ? (
                        <div className="text-muted">No sales yet</div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {topProducts.map((p, idx) => (
                            <div
                              key={p._id || idx}
                              className="list-group-item px-0 d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <div className="fw-bold small">{p.name}</div>
                                <div className="text-muted small">
                                  {p.totalQuantity} sold
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold">
                                  ETB{" "}
                                  {Number(p.totalRevenue || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Low Stock Alerts */}
                {overview.lowStock && overview.lowStock.length > 0 && (
                  <div className="col-12">
                    <div className="card border-0 shadow-sm border-warning">
                      <div className="card-header bg-warning bg-opacity-10">
                        <strong>
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          Low Stock Alerts
                        </strong>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          {overview.lowStock.map((p) => (
                            <div key={p._id} className="col-12 col-md-6">
                              <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                <span className="fw-bold">{p.name}</span>
                                <span className="badge bg-warning text-dark">
                                  {p.stock} left
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-muted">Failed to load overview</div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="card border-0 shadow-sm mb-4" ref={formRef}>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12 col-md-3">
                <input
                  className="form-control"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-3">
                <input
                  className="form-control"
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="col-6 col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col-6 col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div className="col-12">
                <input
                  className="form-control"
                  placeholder="Images (comma-separated URLs)"
                  value={form.imagesText}
                  onChange={(e) =>
                    setForm({ ...form, imagesText: e.target.value })
                  }
                />
                <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-control"
                    style={{ maxWidth: 320 }}
                    onChange={(e) => setSelectedFiles(e.target.files || [])}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={async () => {
                      if (!selectedFiles.length) return;
                      setUploading(true);
                      try {
                        const urls = await uploadMultipleToCloudinary(
                          selectedFiles
                        );
                        const current = String(form.imagesText || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const combined = Array.from(
                          new Set([...current, ...urls])
                        );
                        setForm({ ...form, imagesText: combined.join(", ") });
                        setSelectedFiles([]);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading || !selectedFiles.length}
                    title="Upload selected files to Cloudinary"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                  {!!selectedFiles.length && (
                    <small className="text-muted">
                      {selectedFiles.length} file
                      {selectedFiles.length > 1 ? "s" : ""} selected
                    </small>
                  )}
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <select
                  className="form-select"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                >
                  <option value="">Select Brand</option>
                  {brandOptions.map((br) => (
                    <option key={br._id} value={br.name}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  placeholder="Description"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-auto ms-md-auto d-flex gap-2">
                {editId && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={onReset}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={onCreate}
                  disabled={busy}
                >
                  {editId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <strong>Conversations</strong>
              </div>
              <div className="card-body p-0">
                {loadingThreads ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : contactThreads.length === 0 ? (
                  <div className="p-3 text-muted text-center">
                    No messages yet
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {contactThreads.map((thread) => (
                      <button
                        key={thread._id}
                        className={`list-group-item list-group-item-action ${
                          selectedThread?._id === thread._id ? "active" : ""
                        }`}
                        onClick={() => setSelectedThread(thread)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">
                              {thread.buyer?.displayName ||
                                thread.buyer?.email ||
                                "Buyer"}
                            </div>
                            <small className="text-muted d-block">
                              Order #{String(thread.order?._id || "").slice(-6)}
                            </small>
                            {thread.lastMessage && (
                              <small className="text-muted d-block mt-1">
                                {thread.lastMessage.body?.substring(0, 50) ||
                                  "Attachment"}
                                ...
                              </small>
                            )}
                          </div>
                          {thread.unreadCount > 0 && (
                            <span className="badge bg-primary rounded-pill">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex justify-content-between">
                <strong>Messages</strong>
                {selectedThread && (
                  <span className="badge bg-light text-dark">
                    {selectedThread.buyer?.displayName ||
                      selectedThread.buyer?.email ||
                      "Buyer"}
                  </span>
                )}
              </div>
              <div className="card-body d-flex flex-column">
                {!selectedThread ? (
                  <div className="text-muted text-center py-5">
                    Select a conversation to view messages
                  </div>
                ) : threadLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="small text-muted mb-2">
                        Order #
                        {String(selectedThread.order?._id || "").slice(-8)} •{" "}
                        {selectedThread.order?.status || "N/A"}
                      </div>
                    </div>
                    <div
                      className="flex-grow-1 mb-3"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {selectedThread.messages?.length === 0 ? (
                        <div className="text-muted text-center py-4">
                          No messages yet
                        </div>
                      ) : (
                        <div className="list-group">
                          {selectedThread.messages
                            ?.sort(
                              (a, b) =>
                                new Date(a.createdAt) - new Date(b.createdAt)
                            )
                            .map((msg, idx) => (
                              <div
                                key={idx}
                                className={`list-group-item border-0 border-start border-4 ${
                                  msg.sender === "seller"
                                    ? "border-success bg-light"
                                    : "border-primary"
                                }`}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="fw-bold text-capitalize">
                                    {msg.sender}
                                  </span>
                                  <small className="text-muted">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </small>
                                </div>
                                {msg.body && (
                                  <div className="mt-2">{msg.body}</div>
                                )}
                                {msg.attachments?.length > 0 && (
                                  <div className="mt-2 d-flex flex-wrap gap-2">
                                    {msg.attachments.map((att, index) => (
                                      <a
                                        key={index}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-primary"
                                      >
                                        <i className="fas fa-paperclip me-1"></i>
                                        Attachment {index + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!replyText.trim() && replyFiles.length === 0) {
                          window.alert(
                            "Please provide a message or upload a file"
                          );
                          return;
                        }
                        setReplying(true);
                        try {
                          let attachments = [];
                          if (replyFiles.length) {
                            attachments = await uploadMultipleToCloudinary(
                              replyFiles
                            );
                          }
                          await replyToContactThread(selectedThread._id, {
                            message: replyText.trim(),
                            attachments,
                          });
                          const updated = await fetchContactThread(
                            selectedThread._id
                          );
                          setSelectedThread(updated);
                          setReplyText("");
                          setReplyFiles([]);
                          // Refresh threads list
                          const threads = await fetchMyContactThreads();
                          setContactThreads(threads || []);
                        } catch (err) {
                          console.error("Failed to send reply:", err);
                          window.alert(
                            err?.response?.data?.message ||
                              "Failed to send reply. Please try again."
                          );
                        } finally {
                          setReplying(false);
                        }
                      }}
                    >
                      <div className="mb-3">
                        <label className="form-label">Reply</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply here..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Attach file (optional)
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          onChange={(e) =>
                            setReplyFiles(Array.from(e.target.files || []))
                          }
                        />
                        {replyFiles.length > 0 && (
                          <div className="form-text">
                            {replyFiles.length} file
                            {replyFiles.length > 1 ? "s" : ""} selected
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={replying}
                      >
                        {replying ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-1"></i>
                            Send Reply
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="row">
          {items.map((p) => (
            <div key={p._id} className="col-12 col-md-6 col-lg-4 mb-3">
              <div className="card h-100 shadow-sm border-0">
                <img
                  src={p.images?.[0]}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body d-flex flex-column">
                  <h6 className="fw-bold mb-1">{p.name}</h6>
                  <div className="text-muted small mb-2">{p.slug}</div>
                  <div className="mb-2">
                    ETB {Number(p.price).toLocaleString()}
                  </div>
                  <div className="mb-2">Stock: {p.stock}</div>
                  <div className="mt-auto d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onEdit(p)}
                      disabled={busy}
                      title="Edit product"
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDelete(p._id)}
                      disabled={busy}
                      title="Delete product"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="d-flex justify-content-between align-items-center my-3">
          <div className="text-muted small">
            Showing page {page} of {pages} ({total} items)
          </div>
          <div className="btn-group">
            <button
              className="btn btn-orange-outline"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-orange-outline"
              disabled={page >= pages}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="alert alert-info small d-flex gap-3 align-items-start">
              <i className="fas fa-shield-alt mt-1"></i>
              <div>
                <strong>Order timeline:</strong>
                <div>1) Pending → Admin verifies Telebirr</div>
                <div>2) Paid → Admin releases order (Processing)</div>
                <div>3) You update: Processing → Shipped → Completed</div>
              </div>
            </div>
            {orders.items.length === 0 ? (
              <div className="text-muted">No orders found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "30px" }}></th>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Telebirr Txn</th>
                      <th>Verify</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ width: "220px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.items.map((o) => {
                      const isExpanded = expandedOrders.has(o._id);
                      const isOrderBusy = orderStatusBusy.has(o._id);
                      const isPaymentVerified =
                        o.paymentDetails?.verifiedByAdmin;
                      return (
                        <React.Fragment key={o._id}>
                          <tr
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleOrderExpanded(o._id)}
                          >
                            <td>
                              <i
                                className={`fas fa-chevron-${
                                  isExpanded ? "down" : "right"
                                } text-muted`}
                              ></i>
                            </td>
                            <td className="text-muted">
                              #{String(o._id).slice(-6)}
                            </td>
                            <td>{o.user?.email || "-"}</td>
                            <td>
                              ETB{" "}
                              {Number(
                                o.subtotal ?? o.total ?? o.amount ?? 0
                              ).toLocaleString()}
                            </td>
                            <td>
                              {o.paymentDetails?.transactionId || (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {o.paymentDetails?.verifiedByAdmin ? (
                                <span className="badge bg-success">
                                  <i className="fas fa-check me-1"></i> Verified
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark">
                                  <i className="fas fa-clock me-1"></i> Pending
                                  Admin
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <span
                                  className={`badge ${
                                    statusBadgeMap[o.status] || "bg-secondary"
                                  } align-self-start`}
                                >
                                  {formatStatusLabel(o.status)}
                                </span>
                                <small className="text-muted mt-1">
                                  <i className="fas fa-info-circle me-1"></i>
                                  {statusHelperText[o.status] ||
                                    "Status managed by admin."}
                                </small>
                              </div>
                            </td>
                            <td>
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              {(() => {
                                const actionState = getSellerActionState(o);
                                return actionState.nextStatus ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={isOrderBusy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateOrderStatus(
                                        o._id,
                                        actionState.nextStatus
                                      );
                                    }}
                                  >
                                    {isOrderBusy ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <>
                                        {actionState.icon && (
                                          <i
                                            className={`${actionState.icon} me-1`}
                                          ></i>
                                        )}
                                        {actionState.label}
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <small className="text-muted">
                                    {actionState.icon && (
                                      <i
                                        className={`${actionState.icon} me-1`}
                                      ></i>
                                    )}
                                    {actionState.message}
                                  </small>
                                );
                              })()}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-0">
                                <div className="p-3 bg-light">
                                  <h6 className="mb-3">
                                    Your Items in This Order
                                  </h6>
                                  <div className="row g-3">
                                    {o.items?.map((item, idx) => {
                                      const itemKey = `${o._id}-${String(
                                        item.product
                                      )}`;
                                      const isBusy = shippingBusy.has(itemKey);
                                      const isShipped =
                                        item.shippingStatus === "shipped" ||
                                        item.shippingStatus === "delivered";
                                      return (
                                        <div
                                          key={idx}
                                          className="col-12 col-md-6 col-lg-4"
                                        >
                                          <div className="card border">
                                            <div className="card-body">
                                              <div className="d-flex gap-2 mb-2">
                                                {item.image && (
                                                  <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{
                                                      width: 50,
                                                      height: 50,
                                                      objectFit: "cover",
                                                      borderRadius: 4,
                                                    }}
                                                  />
                                                )}
                                                <div className="flex-grow-1">
                                                  <div className="fw-bold small">
                                                    {item.name}
                                                  </div>
                                                  <div className="text-muted small">
                                                    Qty: {item.quantity} × ETB{" "}
                                                    {Number(
                                                      item.price
                                                    ).toLocaleString()}
                                                  </div>
                                                  <div className="text-muted small">
                                                    Total: ETB{" "}
                                                    {Number(
                                                      item.price * item.quantity
                                                    ).toLocaleString()}
                                                  </div>
                                                  <div className="text-muted small">
                                                    Commission: ETB{" "}
                                                    {Number(
                                                      item.commissionAmount || 0
                                                    ).toLocaleString()}
                                                  </div>
                                                  <div className="text-success small">
                                                    Net: ETB{" "}
                                                    {Number(
                                                      item.sellerEarnings ??
                                                        item.price *
                                                          item.quantity -
                                                          (item.commissionAmount ||
                                                            0)
                                                    ).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="mt-2">
                                                <div className="mb-2">
                                                  <span className="badge badge-orange">
                                                    {item.shippingStatus ||
                                                      "pending"}
                                                  </span>
                                                  {item.shippedAt && (
                                                    <small className="text-muted ms-2">
                                                      Shipped:{" "}
                                                      {new Date(
                                                        item.shippedAt
                                                      ).toLocaleDateString()}
                                                    </small>
                                                  )}
                                                </div>
                                                {!isShipped && (
                                                  <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleMarkShipped(
                                                        o._id,
                                                        String(item.product)
                                                      );
                                                    }}
                                                    disabled={isBusy}
                                                  >
                                                    {isBusy ? (
                                                      <>
                                                        <span
                                                          className="spinner-border spinner-border-sm me-1"
                                                          role="status"
                                                        ></span>
                                                        Updating...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <i className="fas fa-shipping-fast me-1"></i>
                                                        Mark as Shipped
                                                      </>
                                                    )}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
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
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Showing page {orders.page} of {orders.pages} ({orders.total}{" "}
                orders)
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-orange-outline"
                  disabled={orders.page <= 1}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const data = await fetchMyOrders({
                        page: orders.page - 1,
                        limit: 10,
                      });
                      setOrders(data);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Previous
                </button>
                <button
                  className="btn btn-orange-outline"
                  disabled={orders.page >= orders.pages}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const data = await fetchMyOrders({
                        page: orders.page + 1,
                        limit: 10,
                      });
                      setOrders(data);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SellerApplyCard({ initialData, onSuccess }) {
  const [form, setForm] = useState({
    shopName: initialData?.shopName || "",
    phone: initialData?.phone || "",
    description: initialData?.description || "",
  });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onApply = async () => {
    if (!form.shopName.trim() || !form.phone.trim()) {
      setError("Shop name and phone number are required");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await applyForSeller(form);
      setSent(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit application. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="alert alert-success">
        <i className="fas fa-check-circle me-2"></i>
        <strong>Application submitted successfully!</strong> We will review it
        soon and notify you via email.
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary bg-opacity-10">
        <strong>Apply to Become a Seller</strong>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">
              Shop Name <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              placeholder="Enter your shop/business name"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">
              Phone Number <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              placeholder="Your contact phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label">Shop Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Brief description of your shop/business (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <small className="text-muted">
              Provide details about what you sell, your business experience,
              etc.
            </small>
          </div>
          <div className="col-12">
            <button
              className="btn btn-primary"
              onClick={onApply}
              disabled={busy || !form.shopName.trim() || !form.phone.trim()}
            >
              {busy ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Submit Application
                </>
              )}
            </button>
          </div>
        </div>
        <div className="alert alert-info mt-3 mb-0">
          <i className="fas fa-info-circle me-2"></i>
          Your application will be reviewed by our admin team. You'll receive an
          email notification once a decision has been made.
        </div>
      </div>
    </div>
  );
}
