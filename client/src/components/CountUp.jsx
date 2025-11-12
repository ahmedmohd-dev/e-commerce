import React, { useEffect, useMemo, useRef, useState } from "react";

export default function CountUp({
  value = 0,
  duration = 800,
  formatter,
  className,
}) {
  const [display, setDisplay] = useState(0);
  const startTsRef = useRef(null);
  const startValRef = useRef(0);
  const target = Number(value) || 0;

  const format = useMemo(() => {
    if (typeof formatter === "function") return formatter;
    return (v) => v.toLocaleString();
  }, [formatter]);

  useEffect(() => {
    let rafId;
    const startVal = display;
    startValRef.current = startVal;
    startTsRef.current = null;

    const step = (ts) => {
      if (!startTsRef.current) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startVal + (target - startVal) * eased;
      setDisplay(next);
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span className={className}>{format(Math.round(display))}</span>;
}



