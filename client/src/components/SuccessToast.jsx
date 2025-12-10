import React, { useEffect, useState } from "react";
import "./SuccessToast.css";

export default function SuccessToast({ show, message, onClose }) {
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
    <div className={`success-toast ${isVisible ? "show" : "hide"}`}>
      <div className="success-toast__content">
        <div className="success-toast__icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="success-toast__message">
          <strong>{message}</strong>
        </div>
        <button
          className="success-toast__close"
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















