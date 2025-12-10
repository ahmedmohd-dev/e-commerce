import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function ProductCarousel({ products }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  React.useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [products]);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        No products available at the moment.
      </div>
    );
  }

  return (
    <div className="product-carousel-wrapper position-relative">
      {canScrollLeft && (
        <button
          className="carousel-nav-btn carousel-nav-btn--left"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
      )}
      <div className="product-carousel" ref={scrollRef} onScroll={checkScroll}>
        {products.map((product) => (
          <div key={product._id} className="product-carousel__item">
            <Link
              to={`/product/${product.slug}`}
              className="text-decoration-none"
            >
              <div className="product-card">
                <div className="product-card__image-wrapper">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-card__image"
                    />
                  ) : (
                    <div className="product-card__placeholder">
                      <i className="fas fa-image fa-3x text-muted"></i>
                    </div>
                  )}
                  {product.sale?.isEnabled && (
                    <span className="product-card__badge product-card__badge--sale">
                      {product.sale.badgeText || "Sale"}
                    </span>
                  )}
                  {product.rating === 0 && (
                    <span className="product-card__badge product-card__badge--new">
                      New
                    </span>
                  )}
                </div>
                <div className="product-card__body">
                  <h6 className="product-card__title">{product.name}</h6>
                  {product.numReviews > 0 && product.rating > 0 && (
                    <div className="product-card__rating mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star ${
                            i < Math.floor(product.rating || 0)
                              ? "text-warning"
                              : "text-muted opacity-25"
                          }`}
                          style={{ fontSize: "0.75rem" }}
                        ></i>
                      ))}
                      <small className="text-muted ms-1">
                        ({product.numReviews})
                      </small>
                    </div>
                  )}
                  <div className="product-card__price">
                    {product.sale?.isEnabled &&
                    product.sale?.price < product.price ? (
                      <>
                        <span className="text-decoration-line-through text-muted me-2">
                          ETB {product.price?.toLocaleString()}
                        </span>
                        <span className="fw-bold text-danger">
                          ETB {product.sale.price?.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="fw-bold">
                        ETB {product.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button
          className="carousel-nav-btn carousel-nav-btn--right"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      )}
    </div>
  );
}
