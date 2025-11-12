import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import { fetchCategories } from "../api/categoryApi";

export default function AdminCategories() {
  const { profile, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const blank = {
    name: "",
    slug: "",
    isActive: true,
  };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!profile || profile.role !== "admin") return;
    loadCategories();
  }, [loading, profile]);

  const loadCategories = async () => {
    setBusy(true);
    setError("");
    try {
      const cats = await fetchCategories(http);
      setItems(cats);
    } catch {
      setError("Failed to load categories");
    } finally {
      setBusy(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const onEdit = (cat) => {
    setEditId(cat._id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      isActive: cat.isActive !== false,
    });
  };

  const onReset = () => {
    setEditId(null);
    setForm(blank);
    setSuccess("");
    setError("");
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || generateSlug(form.name),
        isActive: Boolean(form.isActive),
      };
      if (editId) {
        await http.put(`/api/categories/admin/${editId}`, payload);
      } else {
        await http.post("/api/categories/admin", payload);
      }
      await loadCategories();
      setSuccess(editId ? "Category updated" : "Category created");
      if (!editId) onReset();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id) => {
    if (
      !window.confirm(
        "Delete this category? Products using it may be affected."
      )
    )
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await http.delete(`/api/categories/admin/${id}`);
      await loadCategories();
      setSuccess("Category deleted");
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed");
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
        <h3 className="mb-0">Admin • Categories</h3>
        <button
          className="btn btn-outline-secondary"
          onClick={onReset}
          disabled={busy}
        >
          New Category
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <form className="card border-0 shadow-sm mb-4" onSubmit={saveCategory}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({
                    ...form,
                    name,
                    slug: form.slug || generateSlug(name),
                  });
                }}
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
            <div className="col-md-2 d-flex align-items-end">
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
            <div className="col-md-2 d-flex align-items-end justify-content-end">
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
                  <th>Slug</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((cat) => (
                  <tr key={cat._id}>
                    <td className="fw-medium">{cat.name}</td>
                    <td>
                      <code className="text-muted">{cat.slug}</code>
                    </td>
                    <td>
                      {cat.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Inactive</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => onEdit(cat)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteCategory(cat._id)}
                        disabled={busy}
                      >
                        Delete
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
