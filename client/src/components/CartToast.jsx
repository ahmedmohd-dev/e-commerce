import React, { useEffect, useState } from "react";
import "./CartToast.css";

export default function CartToast({ show, productName, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div className={`cart-toast ${isVisible ? "show" : "hide"}`}>
      <div className="cart-toast__content">
        <div className="cart-toast__icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="cart-toast__message">
          <strong>Added to cart!</strong>
          <span>{productName}</span>
        </div>
        <button
          className="cart-toast__close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              if (onClose) onClose();
            }, 300);
          }}
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
















