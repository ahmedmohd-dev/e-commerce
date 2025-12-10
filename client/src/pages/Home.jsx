import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import http from "../api/http";
import ProductCarousel from "../components/ProductCarousel";
import CountdownTimer from "../components/CountdownTimer";
import NewsletterSignup from "../components/NewsletterSignup";
import { formatETB, getEffectivePrice, isSaleActive } from "../utils/pricing";

export default function Home() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mostSold, setMostSold] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoSlide, setPromoSlide] = useState(0);

  const heroImages = [
    "https://i.postimg.cc/FHcyHsNs/hero.png",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
  ];

  const promotions = [
    {
      title: "Mizan Institute of Technology",
      subtitle: "Powering Ethiopia's next generation of builders.",
      image: "https://i.postimg.cc/QNBsMqvL/photo-2025-12-01-11-14-31.jpg",
      link: "https://www.mizantechinstitute.com/",
      tag: "Education",
      imageAlign: "right",
    },
    {
      title: "Umra Go",
      subtitle:
        "Plan spiritual travel with trusted local experts. Modernize you travel by Umrah go. Secure your spot.",
      image: "https://i.postimg.cc/CKJrGWBv/photo-2025-12-01-11-14-24.jpg",
      link: "https://umrago.et/",
      tag: "Travel",
    },
    {
      title: "Ahmed Mohammed",
      subtitle: "Building modern, fast and reliable ",
      image: "https://i.postimg.cc/XvbZ9ygM/1.png",
      link: "https://ahmedmohammed5.netlify.app/",
      tag: "Creative Partner",
      imageAlign: "left",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setPromoSlide((prev) => (prev + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(promoTimer);
  }, [promotions.length]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [popularRes, newRes, saleRes] = await Promise.all([
          http.get("/api/products?sort=popular&limit=12"),
          http.get("/api/products?sort=new&limit=12"),
          http.get("/api/products?sort=sale&limit=8"),
        ]);
        setMostSold(popularRes.data.items || []);
        setNewArrivals(newRes.data.items || []);
        setDeals(saleRes.data.items || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const collections = [
    {
      title: "Summer Collection 2025",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      link: "/products?category=Summer",
    },
    {
      title: "Trending Now",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
      link: "/products?sort=popular",
    },
    {
      title: "Top Picks for You",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
      link: "/products?sort=foryou",
    },
  ];

  return (
    <div>
      {/* Hero Section with Carousel */}
      <section className="hero text-center d-flex align-items-center justify-content-center">
        <div className="hero__slides">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={`hero__slide ${
                index === currentSlide ? "active" : ""
              }`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
        </div>
        <div className="overlay"></div>
        <div className="hero-content text-white">
          <h1 className="display-4 fw-bold">{t("home.welcome")}</h1>
          <p className="lead">Everything you need — delivered with care.</p>
          <Link to="/products" className="btn btn-warning btn-lg mt-3">
            {t("home.shopNow")}
          </Link>
        </div>
        <div className="hero__indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`hero__indicator ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Most Sold Products */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <i className="fas fa-fire text-danger me-2"></i>
              {t("nav.popular")}
            </h2>
            <Link to="/products?sort=popular" className="text-decoration-none">
              {t("common.viewAll")} <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <ProductCarousel products={mostSold} />
          )}
        </div>
      </section>

      {/* Today's Deals / Limited Offers */}
      <section className="py-5 bg-danger text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="fw-bold display-5 mb-3">
                <i className="fas fa-tag me-2"></i>
                Today's Deals
              </h2>
              <p className="lead mb-4">Limited time offers - Don't miss out!</p>
              <CountdownTimer hours={3} minutes={12} seconds={10} />
            </div>
            <div className="col-lg-6">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-white" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : deals.length > 0 ? (
                <div className="row g-3">
                  {deals.slice(0, 4).map((product) => {
                    const activeSale = isSaleActive(product);
                    const finalPrice = getEffectivePrice(product);
                    return (
                      <div key={product._id} className="col-6 col-md-3">
                        <Link
                          to={`/product/${product.slug}`}
                          className="text-decoration-none text-white"
                        >
                          <div className="deal-card bg-white bg-opacity-10 rounded p-3 h-100 text-center">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="img-fluid mb-2"
                                style={{
                                  maxHeight: "100px",
                                  objectFit: "contain",
                                }}
                              />
                            )}
                            <div className="small fw-bold">{product.name}</div>
                            <div className="mt-2">
                              {activeSale && (
                                <span className="text-decoration-line-through opacity-75 me-2">
                                  {formatETB(product.price)}
                                </span>
                              )}
                              <span className="fw-bold">
                                {formatETB(finalPrice)}
                              </span>
                            </div>
                            {product.sale?.badgeText && (
                              <span className="badge bg-warning text-dark mt-2">
                                {product.sale.badgeText}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center">No deals available at the moment.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <i className="fas fa-bolt text-warning me-2"></i>
              {t("nav.newArrivals")}
            </h2>
            <Link to="/products?sort=new" className="text-decoration-none">
              {t("common.viewAll")} <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <ProductCarousel products={newArrivals} />
          )}
        </div>
      </section>

      {/* Collections */}
      <section className="py-5">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">Shop by Collection</h2>
          <div className="row g-4">
            {collections.map((collection, index) => (
              <div key={index} className="col-md-4">
                <Link
                  to={collection.link}
                  className="collection-block text-decoration-none"
                >
                  <div
                    className="collection-block__image"
                    style={{ backgroundImage: `url(${collection.image})` }}
                  >
                    <div className="collection-block__overlay"></div>
                    <div className="collection-block__content">
                      <h3 className="text-white fw-bold">{collection.title}</h3>
                      <span className="text-white">
                        Shop Now <i className="fas fa-arrow-right ms-2"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">Why Shop With Us</h2>
          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className="benefit-card text-center p-4 h-100">
                <div className="benefit-card__icon mb-3">
                  <i className="fas fa-shipping-fast fa-3x text-primary"></i>
                </div>
                <h5 className="fw-bold">Free Shipping</h5>
                <p className="text-muted mb-0">
                  Free shipping on orders over ETB 500
                </p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="benefit-card text-center p-4 h-100">
                <div className="benefit-card__icon mb-3">
                  <i className="fas fa-undo fa-3x text-success"></i>
                </div>
                <h5 className="fw-bold">Easy Returns</h5>
                <p className="text-muted mb-0">
                  30-day return policy, no questions asked
                </p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="benefit-card text-center p-4 h-100">
                <div className="benefit-card__icon mb-3">
                  <i className="fas fa-shield-alt fa-3x text-info"></i>
                </div>
                <h5 className="fw-bold">Secure Payments</h5>
                <p className="text-muted mb-0">
                  Your payment information is safe with us
                </p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="benefit-card text-center p-4 h-100">
                <div className="benefit-card__icon mb-3">
                  <i className="fas fa-headset fa-3x text-warning"></i>
                </div>
                <h5 className="fw-bold">24/7 Support</h5>
                <p className="text-muted mb-0">
                  Our support team is always here to help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Promotions */}
      <section className="py-5 promo-spotlight">
        <div className="container">
          <span className="promo-ad-label">Advertisement</span>
          <div className="promo-slider rounded-4 overflow-hidden position-relative">
            {promotions.map((promo, index) => (
              <div
                key={promo.title}
                className={`promo-slide ${
                  index === promoSlide ? "active" : ""
                }`}
                style={{
                  backgroundImage: `url(${promo.image})`,
                  backgroundPosition:
                    promo.imageAlign === "right" ? "right center" : "center",
                }}
              >
                <div className="promo-slide__overlay"></div>
                <div className="promo-slide__content text-white">
                  <span className="badge bg-light text-dark mb-3">
                    {promo.tag}
                  </span>
                  <h2 className="display-5 fw-bold">{promo.title}</h2>
                  <p className="lead mb-4">{promo.subtitle}</p>
                  <a
                    href={promo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light btn-lg fw-semibold"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            ))}
            <div className="promo-controls">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`promo-dot ${
                    index === promoSlide ? "active" : ""
                  }`}
                  onClick={() => setPromoSlide(index)}
                  aria-label={`Show promotion ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />
    </div>
  );
}
