import React, { useState, useEffect } from "react";
import "./IntroAnimation.css";

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Logo appears
      setTimeout(() => setPhase(2), 1200), // Text appears
      setTimeout(() => setPhase(3), 2000), // Scale up
      setTimeout(() => {
        setPhase(4); // Fade out
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }, 2800),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`intro-animation ${phase >= 4 ? "fade-out" : ""}`}>
      <div className="intro-background">
        <div className="intro-gradient"></div>
      </div>
      <div className="intro-content">
        <div className={`intro-logo ${phase >= 1 ? "visible" : ""}`}>
          <i className="bi bi-cart4"></i>
        </div>
        <div className={`intro-text ${phase >= 2 ? "visible" : ""}`}>
          <h1 className="intro-title">
            <span className="text-highlight">Mega</span>Mart
          </h1>
          <p className="intro-subtitle">Your trusted shopping destination</p>
        </div>
        <div className={`intro-loader ${phase >= 3 ? "active" : ""}`}>
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
}
















