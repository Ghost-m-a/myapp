/** 600x200 SVG sparkline, ported from the legacy areaChart() helper. */
export function AreaChart({ values }: { values: number[] }) {
   const max = Math.max(...values, 1);
   const min = Math.min(...values, 0);
   const span = max - min || 1;
   const n = Math.max(values.length - 1, 1);
   const pts = values.map((v, i) => [
      (i / n) * 600,
      185 - ((v - min) / span) * 165,
   ]);
   const line = pts
      .map(([x, y], idx) => `${idx ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
   return (
      <svg
         className="dash-chart"
         viewBox="0 0 600 200"
         preserveAspectRatio="none"
         aria-hidden="true"
      >
         <path
            d={`${line} L600 200 L0 200Z`}
            fill="#9ca3af"
            fillOpacity="0.22"
         />
         <path
            d={line}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
         />
      </svg>
   );
}
