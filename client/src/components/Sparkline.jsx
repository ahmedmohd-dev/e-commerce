import React from "react";

export default function Sparkline({
  data = [],
  width = 120,
  height = 32,
  stroke = "#f97316",
  fill = "rgba(249, 115, 22, 0.15)",
  animate = true,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2; // padding 2px
    return `${x},${y}`;
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p}` : `${acc} L ${p}`),
    ""
  );

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaD} fill={fill} stroke="none" />
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? "sparkline-path-animate" : undefined}
      />
    </svg>
  );
}
