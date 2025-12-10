import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { label: t("nav.forYou"), to: "/products?sort=foryou" },
      { label: t("nav.newArrivals"), to: "/products?sort=new" },
      { label: t("nav.popular"), to: "/products?sort=popular" },
      { label: t("nav.sale"), to: "/products?sort=sale" },
      { label: "All Products", to: "/products" },
    ],
    company: [
      { label: "About Us", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Careers", to: "/careers" },
      { label: "Blog", to: "/blog" },
    ],
    customer: [
      { label: "Help Center", to: "/help" },
      { label: "Shipping Info", to: "/shipping" },
      { label: "Returns", to: "/returns" },
      { label: "Size Guide", to: "/size-guide" },
    ],
    legal: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Refund Policy", to: "/refund" },
      { label: "Cookie Policy", to: "/cookies" },
    ],
  };

  const partners = [
    {
      name: "Telebirr",
      logo: "https://i.postimg.cc/nhJFq87q/telebirr.png",
      url: "https://telebirr.et",
    },
    {
      name: "Arifpay",
      logo: "https://i.postimg.cc/rw16TKDg/arifpay.jpg",
      url: "https://arifpay.net",
    },
    {
      name: "Santim Pay",
      logo: "https://i.postimg.cc/8PhDpy3k/santimpay.jpg",
      url: "https://santimpay.com/",
    },
    {
      name: "Amole",
      logo: "https://i.postimg.cc/3wbQSzyZ/amole.webp",
      url: "https://www.amole.et/",
    },
  ];

  const socialLinks = [
    { icon: "fab fa-facebook-f", url: "#", label: "Facebook" },
    { icon: "fab fa-telegram-plane", url: "#", label: "Telegram" },
    { icon: "fab fa-instagram", url: "#", label: "Instagram" },
    { icon: "fab fa-linkedin-in", url: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="footer bg-dark text-white py-5">
      <div className="container">
        {/* Main Footer Content */}
        <div className="row mb-4">
          {/* Our Partners Column */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="fw-bold mb-3 text-white">Our Partners</h6>
            <div className="footer-partners d-flex flex-wrap gap-3">
              {partners.map((partner, index) => (
                <a
                  key={index}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-partner-link"
                  title={partner.name}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="footer-partner-logo"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="fw-bold mb-3 text-white">Shop</h6>
            <ul className="list-unstyled footer-links">
              {footerLinks.shop.map((link, index) => (
                <li key={index} className="mb-2">
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="fw-bold mb-3 text-white">Company</h6>
            <ul className="list-unstyled footer-links">
              {footerLinks.company.map((link, index) => (
                <li key={index} className="mb-2">
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Customer Service Column */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold mb-3 text-white">Contact Us</h6>
            <ul className="list-unstyled footer-links">
              <li className="mb-2 footer-contact-item">
                <i className="fas fa-phone text-primary"></i>
                <a
                  href="tel:+251913367176"
                  className="footer-link footer-contact-text"
                >
                  +251-913-36-7176
                </a>
              </li>
              <li className="mb-2 footer-contact-item">
                <i className="fas fa-envelope text-primary"></i>
                <a
                  href="mailto:info@megamart.et"
                  className="footer-link footer-contact-text"
                >
                  info@megamart.et
                </a>
              </li>
              <li className="mb-2 footer-contact-item">
                <i className="fas fa-map-marker-alt text-primary"></i>
                <span className="footer-contact-text">
                  Addis Ababa, Ethiopia
                </span>
              </li>
            </ul>
            {/* Social Media Icons */}
            <div className="footer-social mt-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="footer-social__link"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="row pt-4 border-top border-secondary">
          <div className="col-12 text-center">
            <p className="text-white mb-1">
              © 2025 MegaMart. All rights reserved.
            </p>
            <p className="text-white mb-0">
              Developed by{" "}
              <a
                href="https://ahmedmohammed5.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-dev-link"
              >
                Ahmed Mohammed
              </a>{" "}
              | Full-Stack Web Developer
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
