import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchAutocomplete } from "../api/productApi";

export default function SearchBar({
  placeholder = "Search products...",
  maxWidth = 560,
  className = "",
  onSubmit, // optional custom submit handler (used for mobile overlay)
  value, // controlled value (optional)
  onChange, // controlled onChange handler (optional)
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Sync with controlled value if provided
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await searchAutocomplete(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!query.trim()) return;
    const term = query.trim();
    if (onSubmit) {
      onSubmit(term, {
        clear: () => setQuery(""),
        closeSuggestions: () => setShowSuggestions(false),
      });
      return;
    }
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
    setQuery("");
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product.slug}`);
    setShowSuggestions(false);
    setQuery("");
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${
          i < Math.floor(rating) ? "text-warning" : "text-muted opacity-25"
        }`}
        style={{ fontSize: "0.7rem" }}
      ></i>
    ));
  };

  const wrapperStyle = {
    width: "100%",
  };
  if (maxWidth !== null) {
    wrapperStyle.maxWidth =
      typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  }

  return (
    <div
      className={`position-relative flex-grow-1 ${className}`.trim()}
      style={wrapperStyle}
    >
      <form onSubmit={handleSubmit} ref={searchRef}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={value !== undefined ? value : query}
            onChange={handleChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          <button className="btn btn-orange" type="submit">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="position-absolute top-100 start-0 w-100 mt-1 bg-white border rounded shadow-lg"
          style={{ zIndex: 1000, maxHeight: "400px", overflowY: "auto" }}
        >
          {loading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm text-primary" />
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((product) => (
                <div
                  key={product._id}
                  className="p-3 border-bottom cursor-pointer"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSuggestionClick(product)}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "white")
                  }
                >
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="rounded"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{product.name}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        {renderStars(product.rating)}
                        {product.rating > 0 && (
                          <small className="text-muted">
                            {product.rating.toFixed(1)} (
                            {product.numReviews || 0})
                          </small>
                        )}
                      </div>
                      <div className="text-primary fw-bold mt-1">
                        ETB {product.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="p-2 text-center border-top bg-light"
                style={{ cursor: "pointer" }}
                onClick={handleSubmit}
              >
                <small className="text-primary">
                  View all results for "{query}"
                </small>
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="p-3 text-center text-muted">No products found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
