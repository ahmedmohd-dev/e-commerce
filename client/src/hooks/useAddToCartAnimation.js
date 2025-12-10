import { useCallback } from "react";

export default function useAddToCartAnimation() {
  const triggerAnimation = useCallback((imageElement, options = {}) => {
    if (!imageElement) return;

    const {
      targetSelector = ".mega-cart-icon",
      mobileTargetSelector = ".mega-mobile-cart-icon",
      pulseClass = "cart-icon-pulse",
    } = options;

    const isMobile = window.matchMedia("(max-width: 991px)")?.matches;

    const selectorCandidates = isMobile
      ? [mobileTargetSelector, targetSelector]
      : [targetSelector, mobileTargetSelector];

    const targetIcon = selectorCandidates
      .filter(Boolean)
      .map((sel) => document.querySelector(sel))
      .find(Boolean);
    if (!targetIcon) return;

    const imgRect = imageElement.getBoundingClientRect();
    const targetRect = targetIcon.getBoundingClientRect();

    const flyingImg = imageElement.cloneNode(true);
    flyingImg.classList.add("flying-image");

    flyingImg.style.width = imgRect.width + "px";
    flyingImg.style.height = imgRect.height + "px";
    flyingImg.style.left = imgRect.left + imgRect.width / 2 + "px";
    flyingImg.style.top = imgRect.top + imgRect.height / 2 + "px";

    document.body.appendChild(flyingImg);

    // Force layout so the browser applies the initial position
    // eslint-disable-next-line no-unused-expressions
    flyingImg.offsetHeight;

    const deltaX =
      targetRect.left +
      targetRect.width / 2 -
      (imgRect.left + imgRect.width / 2);
    const deltaY =
      targetRect.top +
      targetRect.height / 2 -
      (imgRect.top + imgRect.height / 2);

    flyingImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
    flyingImg.style.opacity = "0";

    targetIcon.classList.add(pulseClass);

    const cleanup = () => {
      flyingImg.remove();
      targetIcon.classList.remove(pulseClass);
    };

    flyingImg.addEventListener("transitionend", cleanup, { once: true });
  }, []);

  return triggerAnimation;
}
