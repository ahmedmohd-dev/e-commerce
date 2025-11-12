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
  const [activeTab, setActiveTab] = useState("overview"); // overview | products | orders
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
        setOverview(ov);
        setRecentOrders(rec);
        setTopProducts(top);
      } catch (err) {
        console.error("Failed to load overview:", err);
      } finally {
        setOverviewLoading(false);
      }
    }
    loadOverview();
  }, [canManage, activeTab]);

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

  const handleVerifyPayment = async (orderId) => {
    setOrderBusy(orderId, true);
    try {
      await updateOrderStatus(orderId, {
        paymentVerified: true,
        status: "paid",
      });
      await reloadOrders();
    } catch (err) {
      console.error("Failed to verify payment:", err);
      window.alert(
        err?.response?.data?.message ||
          "Failed to verify payment. Please try again."
      );
    } finally {
      setOrderBusy(orderId, false);
    }
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
                            <CountUp end={overview.totals?.products || 0} />
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
                            <CountUp end={overview.totals?.orders || 0} />
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
                              end={
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
                            <CountUp end={overview.totals?.itemsShipped || 0} />
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
                      <th>Subtotal (Your items)</th>
                      <th>Net Earnings</th>
                      <th>Order Status</th>
                      <th>Date</th>
                      <th style={{ width: "220px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.items.map((o) => {
                      const isExpanded = expandedOrders.has(o._id);
                      const isOrderBusy = orderStatusBusy.has(o._id);
                      const isPaid =
                        o.status === "paid" ||
                        o.paymentDetails?.verifiedBySeller;
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
                              ETB {Number(o.subtotal || 0).toLocaleString()}
                            </td>
                            <td>
                              ETB{" "}
                              {Number(
                                o.net ?? o.subtotal ?? 0
                              ).toLocaleString()}
                            </td>
                            <td>
                              <span className="badge badge-orange text-uppercase">
                                {o.status}
                              </span>
                              {o.paymentDetails?.verifiedBySeller && (
                                <div className="small text-success mt-1">
                                  <i className="fas fa-check-circle me-1"></i>
                                  Payment verified
                                </div>
                              )}
                            </td>
                            <td>
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="d-flex gap-2 flex-wrap">
                                {!isPaid && (
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    disabled={isOrderBusy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerifyPayment(o._id);
                                    }}
                                  >
                                    {isOrderBusy ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <>
                                        <i className="fas fa-check me-1"></i>
                                        Verify Payment
                                      </>
                                    )}
                                  </button>
                                )}
                                {o.status !== "completed" && (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    disabled={isOrderBusy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateOrderStatus(
                                        o._id,
                                        "completed"
                                      );
                                    }}
                                  >
                                    {isOrderBusy ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <>
                                        <i className="fas fa-flag-checkered me-1"></i>
                                        Mark Completed
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0">
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
