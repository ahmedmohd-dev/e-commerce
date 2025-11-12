import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import { fetchCategories } from "../api/categoryApi";
import { fetchBrands } from "../api/brandApi";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";

export default function AdminProducts() {
  const { profile, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  const blank = {
    name: "",
    slug: "",
    price: 0,
    description: "",
    imagesText: "", // comma-separated input
    category: "",
    brand: "",
    stock: 0,
    isActive: true,
  };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!profile || profile.role !== "admin") return;
    setBusy(true);
    setError("");
    Promise.all([
      http.get("/api/admin/products").then((r) => r.data),
      fetchCategories(http),
      fetchBrands(http),
    ])
      .then(([prods, cats, brs]) => {
        setItems(prods);
        setCategoryOptions(cats);
        setBrandOptions(brs);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setBusy(false));
  }, [loading, profile]);

  const onEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      price: p.price,
      description: p.description || "",
      imagesText: (p.images || []).join(", "),
      category: p.category || "",
      brand: p.brand || "",
      stock: p.stock || 0,
      isActive: p.isActive !== false,
    });
  };

  const onReset = () => {
    setEditId(null);
    setForm(blank);
    setSuccess("");
    setError("");
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: Number(form.price),
        description: form.description,
        images: form.imagesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        category: form.category,
        brand: form.brand,
        stock: Number(form.stock),
        isActive: Boolean(form.isActive),
      };
      const res = editId
        ? await http.put(`/api/admin/products/${editId}`, payload)
        : await http.post("/api/admin/products", payload);
      // refresh list
      const prods = await http.get("/api/admin/products").then((r) => r.data);
      setItems(prods);
      setSuccess(editId ? "Product updated" : "Product created");
      if (!editId) onReset();
    } catch (err) {
      setError("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onFilesSelected = (e) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const uploadSelectedFiles = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await uploadMultipleToCloudinary(selectedFiles);
      const current = form.imagesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...current, ...urls]));
      setForm({ ...form, imagesText: combined.join(", ") });
      setSelectedFiles([]);
      setSuccess(`Uploaded ${urls.length} image${urls.length > 1 ? "s" : ""}`);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Hide this product?")) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await http.delete(`/api/admin/products/${id}`);
      const prods = await http.get("/api/admin/products").then((r) => r.data);
      setItems(prods);
      setSuccess("Product hidden");
    } catch (e) {
      setError("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (p.isActive) {
        await http.delete(`/api/admin/products/${p._id}`);
        setSuccess("Product hidden");
      } else {
        await http.put(`/api/admin/products/${p._id}`, { isActive: true });
        setSuccess("Product unhidden");
      }
      const prods = await http.get("/api/admin/products").then((r) => r.data);
      setItems(prods);
    } catch (e) {
      setError("Toggle failed");
    } finally {
      setBusy(false);
    }
  };

  if (!loading && (!profile || profile.role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Admin • Products</h3>
        <button
          className="btn btn-outline-secondary"
          onClick={onReset}
          disabled={busy}
        >
          New Product
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <form className="card border-0 shadow-sm mb-4" onSubmit={saveProduct}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Slug</label>
              <input
                className="form-control"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">None</option>
                {categoryOptions.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Brand</label>
              <select
                className="form-select"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              >
                <option value="">None</option>
                {brandOptions.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">
                Images (comma-separated URLs)
              </label>
              <input
                className="form-control"
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
                  onChange={onFilesSelected}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={uploadSelectedFiles}
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
              {Boolean(form.imagesText.trim()) && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {form.imagesText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="preview"
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ))}
                </div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Stock</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActiveChk"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label className="form-check-label" htmlFor="isActiveChk">
                  Active
                </label>
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-end justify-content-end">
              <button className="btn btn-orange" disabled={busy}>
                {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td className="fw-medium">{p.name}</td>
                    <td>${p.price}</td>
                    <td>{p.category || "—"}</td>
                    <td>{p.brand || "—"}</td>
                    <td>{p.stock}</td>
                    <td>
                      {p.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Hidden</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => onEdit(p)}
                        disabled={busy}
                        title="Edit"
                        aria-label="Edit"
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${
                          p.isActive
                            ? "btn-outline-danger"
                            : "btn-outline-success"
                        }`}
                        onClick={() => toggleActive(p)}
                        disabled={busy}
                      >
                        {p.isActive ? (
                          <i
                            className="fas fa-eye-slash"
                            title="Hide"
                            aria-label="Hide"
                          ></i>
                        ) : (
                          <i
                            className="fas fa-eye"
                            title="Unhide"
                            aria-label="Unhide"
                          ></i>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-danger ms-2"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Permanently delete this product? This cannot be undone."
                            )
                          )
                            return;
                          setBusy(true);
                          setError("");
                          setSuccess("");
                          try {
                            await http.delete(
                              `/api/admin/products/${p._id}/hard`
                            );
                            const prods = await http
                              .get("/api/admin/products")
                              .then((r) => r.data);
                            setItems(prods);
                            setSuccess("Product deleted");
                          } catch (e) {
                            setError("Delete failed");
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={busy}
                        title="Delete permanently"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
