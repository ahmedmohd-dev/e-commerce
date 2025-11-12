import React, { useEffect, useMemo, useRef, useState } from "react";
import http from "../api/http";
import { fetchCategories } from "../api/categoryApi";
import { fetchBrands } from "../api/brandApi";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Current input values (typing here does not auto-fetch)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [sort, setSort] = useState("-createdAt"); // price, -price, name, -name
  const [limit, setLimit] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const filterOpenScrollYRef = useRef(0);

  // Options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  // Applied query (changes only on Apply/Enter/pagination)
  const [appliedQuery, setAppliedQuery] = useState({
    search: "",
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    ratingMin: 0,
    sort: "-createdAt",
    page: 1,
    limit: 12,
  });

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Build query params from applied query
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedQuery.search) params.set("search", appliedQuery.search);
    if (appliedQuery.category) params.set("category", appliedQuery.category);
    if (appliedQuery.brand) params.set("brand", appliedQuery.brand);
    if (appliedQuery.minPrice !== "")
      params.set("minPrice", String(appliedQuery.minPrice));
    if (appliedQuery.maxPrice !== "")
      params.set("maxPrice", String(appliedQuery.maxPrice));
    if (appliedQuery.inStockOnly) params.set("inStock", "true");
    if (appliedQuery.ratingMin && Number(appliedQuery.ratingMin) > 0)
      params.set("ratingMin", String(appliedQuery.ratingMin));
    if (appliedQuery.sort) params.set("sort", appliedQuery.sort);
    params.set("page", String(appliedQuery.page));
    params.set("limit", String(appliedQuery.limit));
    return params.toString();
  }, [appliedQuery]);

  // Fetch when filters or pagination change
  useEffect(() => {
    setLoading(true);
    setError("");
    http
      .get(`/api/products?${queryString}`)
      .then((r) => {
        setData(r.data);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, [queryString]);

  // Load categories/brands once
  useEffect(() => {
    Promise.all([fetchCategories(http), fetchBrands(http)])
      .then(([cats, brs]) => {
        setCategoryOptions(cats);
        setBrandOptions(brs);
      })
      .catch(() => {
        // ignore for UX; filters can still be typed if needed
      });
  }, []);

  // Initialize from URL search params on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    const urlCategory = searchParams.get("category") || "";
    const urlBrand = searchParams.get("brand") || "";
    const urlMin = searchParams.get("minPrice") || "";
    const urlMax = searchParams.get("maxPrice") || "";
    const urlInStock = searchParams.get("inStock") === "true";
    const urlRatingMin = Number(searchParams.get("ratingMin") || 0);
    if (urlSearch) {
      setSearch(urlSearch);
    }
    setCategory(urlCategory);
    setBrand(urlBrand);
    setMinPrice(urlMin);
    setMaxPrice(urlMax);
    setInStockOnly(urlInStock);
    setRatingMin(urlRatingMin);
    setAppliedQuery((prev) => ({
      ...prev,
      search: urlSearch || "",
      category: urlCategory,
      brand: urlBrand,
      minPrice: urlMin,
      maxPrice: urlMax,
      inStockOnly: urlInStock,
      ratingMin: urlRatingMin,
      page: 1,
    }));
  }, []);

  // Keep URL in sync with applied filters
  useEffect(() => {
    const params = new URLSearchParams(queryString);
    setSearchParams(params, { replace: true });
  }, [queryString]);

  // Record scroll position when filters open
  useEffect(() => {
    if (showFilters) {
      filterOpenScrollYRef.current = window.scrollY || 0;
    }
  }, [showFilters]);

  // Auto-hide filters after small scroll threshold (prevents instant close)
  useEffect(() => {
    const onScroll = () => {
      if (!showFilters) return;
      const startY = filterOpenScrollYRef.current || 0;
      const currentY = window.scrollY || 0;
      const delta = Math.abs(currentY - startY);
      if (delta > 80) {
        setShowFilters(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showFilters]);

  const applyFilters = (resetPage = true) => {
    setAppliedQuery((prev) => ({
      search: search.trim(),
      category: category.trim(),
      brand: brand.trim(),
      minPrice: minPrice,
      maxPrice: maxPrice,
      inStockOnly,
      ratingMin,
      sort,
      page: resetPage ? 1 : prev.page,
      limit,
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setRatingMin(0);
    setSort("-createdAt");
    setLimit(12);
    setAppliedQuery({
      search: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
      ratingMin: 0,
      sort: "-createdAt",
      page: 1,
      limit: 12,
    });
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <div className="hero-gradient">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h1 className="hero-title display-6 mb-1">Our Products</h1>
                <p className="hero-subtitle mb-0">
                  Discover our amazing collection
                </p>
              </div>
              <div className="d-none d-md-flex align-items-center gap-2">
                <span className="chip">
                  <i className="fas fa-truck"></i> Fast Shipping
                </span>
                <span className="chip">
                  <i className="fas fa-shield-alt"></i> Secure
                </span>
                <span className="chip">
                  <i className="fas fa-undo"></i> Easy Returns
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top controls: search + filter toggle */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-stretch">
            <div className="col">
              <div className="input-with-icon h-100">
                <i className="fas fa-search icon"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters(true);
                  }}
                />
              </div>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-primary h-100"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
              >
                <i className="fas fa-sliders-h me-2"></i>
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          id="advanced-filters"
          className="card border-0 shadow-sm mb-4 filter-card"
        >
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4 d-none">
                <label className="form-label">Search</label>
                <div className="input-with-icon">
                  <i className="fas fa-search icon"></i>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters(true);
                    }}
                  />
                </div>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {categoryOptions.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Brand</label>
                <select
                  className="form-select"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">All</option>
                  {brandOptions.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Availability</label>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="inStockOnly"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="inStockOnly">
                    In stock only
                  </label>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Minimum Rating</label>
                <div className="d-flex flex-wrap gap-2">
                  {[5, 4, 3, 2, 1, 0].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`btn btn-sm ${
                        ratingMin === r ? "btn-orange" : "btn-outline-info"
                      }`}
                      onClick={() => setRatingMin(r)}
                      title={r === 0 ? "Any rating" : `${r}+ stars`}
                    >
                      {r === 0 ? "Any" : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span>Price Range</span>
                  <span className="small text-muted">
                    ETB {Number(minPrice || 0).toLocaleString()} -{" "}
                    {Number(maxPrice || 0).toLocaleString()}
                  </span>
                </label>
                <div className="range-wrap">
                  <div className="range-track">
                    {(() => {
                      const minV = Math.max(0, Number(minPrice || 0));
                      const maxV = Math.max(minV, Number(maxPrice || 0) || 0);
                      const cap = Math.max(1000, maxV, minV);
                      const left = cap ? (minV / cap) * 100 : 0;
                      const right = cap ? (maxV / cap) * 100 : 0;
                      return (
                        <div
                          className="range-fill"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(0, right - left)}%`,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="range-inputs">
                    <input
                      type="range"
                      min="0"
                      max={String(Math.max(1000, Number(maxPrice || 0) || 0))}
                      value={String(Number(minPrice || 0))}
                      onChange={(e) => {
                        const next = Math.min(
                          Number(e.target.value),
                          Number(maxPrice || 0) || 0
                        );
                        setMinPrice(String(next));
                      }}
                    />
                    <input
                      type="range"
                      min={String(Number(minPrice || 0))}
                      max={String(Math.max(1000, Number(maxPrice || 0) || 0))}
                      value={String(Number(maxPrice || 0))}
                      onChange={(e) => {
                        const next = Math.max(
                          Number(e.target.value),
                          Number(minPrice || 0)
                        );
                        setMaxPrice(String(next));
                      }}
                    />
                  </div>
                </div>
                <div className="row g-2 mt-2">
                  <div className="col-6">
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      min={String(Number(minPrice || 0))}
                      className="form-control"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Sort</label>
                <select
                  className="form-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="-createdAt">Newest</option>
                  <option value="createdAt">Oldest</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                  <option value="-name">Name: Z-A</option>
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Per Page</label>
                <select
                  className="form-select"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                  <option value={24}>24</option>
                </select>
              </div>
              <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 justify-content-end">
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetFilters}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    applyFilters(true);
                    setShowFilters(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
            {error && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center my-3">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      <div className="row">
        {data.items.map((p) => (
          <div key={p._id} className="col-6 col-md-4 col-lg-3 mb-4">
            <div className="card h-100 shadow-sm border-0 product-card">
              <div className="position-relative">
                <img
                  src={p.images?.[0]}
                  className="card-img-top product-img-cover"
                  alt={p.name}
                />
                <div className="position-absolute top-0 end-0 m-2">
                  <span className="badge badge-orange">In Stock</span>
                </div>
                <div className="position-absolute top-0 start-0 m-2">
                  <button
                    className={`btn btn-sm rounded-circle ${
                      isFavorite(p._id) ? "btn-danger" : "btn-outline-danger"
                    }`}
                    onClick={() => toggleFavorite(p)}
                    title={
                      isFavorite(p._id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <i className="fas fa-heart"></i>
                  </button>
                </div>
              </div>
              <div className="card-body d-flex flex-column">
                <h6 className="card-title fw-bold line-clamp-2">{p.name}</h6>
                <p className="card-text text-muted small line-clamp-3">
                  {p.description}
                </p>
                <div className="mt-auto">
                  <div className="mb-2">
                    {p.rating > 0 ? (
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <div className="text-warning">
                          {Array.from({ length: 5 }, (_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${
                                i < Math.floor(p.rating) ? "" : "opacity-50"
                              }`}
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          ))}
                        </div>
                        <small className="text-muted">
                          {p.rating.toFixed(1)} ({p.numReviews || 0})
                        </small>
                      </div>
                    ) : (
                      <small className="text-muted">No ratings yet</small>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="h5 text-primary mb-0">
                      ETB {p.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="d-grid gap-2">
                    <Link className="btn btn-orange" to={`/product/${p.slug}`}>
                      <i className="fas fa-eye me-1"></i>
                      View Details
                    </Link>
                    <button
                      className="btn btn-orange-outline"
                      onClick={() => handleAddToCart(p)}
                    >
                      <i className="fas fa-shopping-cart me-1"></i>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <div className="text-muted small">
          Showing page {data.page} of {data.pages} ({data.total} items)
        </div>
        <div className="btn-group" role="group" aria-label="Pagination">
          <button
            className="btn btn-orange-outline"
            disabled={appliedQuery.page <= 1}
            onClick={() =>
              setAppliedQuery((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
          >
            Previous
          </button>
          <button
            className="btn btn-orange-outline"
            disabled={data.pages ? appliedQuery.page >= data.pages : true}
            onClick={() =>
              setAppliedQuery((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
