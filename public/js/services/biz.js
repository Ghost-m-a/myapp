import { api } from "./api.js";

let specPromise;
export const getSpec = () =>
   (specPromise ||= api("/biz/spec")
      .then((r) => r.kinds)
      .catch((e) => ((specPromise = null), Promise.reject(e))));

export const listRecords = (bid, kind) =>
   api(`/biz/${bid}/records/${kind}`).then((r) => r.records);
export const createRecord = (bid, kind, body) =>
   api(`/biz/${bid}/records/${kind}`, { method: "POST", body }).then(
      (r) => r.record,
   );
export const updateRecord = (bid, kind, id, body) =>
   api(`/biz/${bid}/records/${kind}/${id}`, { method: "PATCH", body }).then(
      (r) => r.record,
   );
export const deleteRecord = (bid, kind, id) =>
   api(`/biz/${bid}/records/${kind}/${id}`, { method: "DELETE" });
export const getStats = (bid, days = 14) =>
   api(`/biz/${bid}/stats?days=${days}`);

export const money = (n = 0) =>
   `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const date = (d) =>
   new Date(d).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
   });

export const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// Running balance per day, ending at the current balance
export function balanceSeries(stats) {
   let running = stats.window.start;
   return stats.series.map((d) => (running += d.in - d.out));
}

export function areaChart(values) {
   const max = Math.max(...values, 1);
   const min = Math.min(...values, 0);
   const span = max - min || 1;
   const n = Math.max(values.length - 1, 1);
   const pts = values.map((v, i) => [
      (i / n) * 600,
      185 - ((v - min) / span) * 165,
   ]);
   const line = pts
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
   return `<svg class="dash-chart" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
    <path d="${line} L600 200 L0 200Z" fill="#9ca3af" fill-opacity="0.22" />
    <path d="${line}" fill="none" stroke="#9ca3af" stroke-width="1.5" vector-effect="non-scaling-stroke" />
  </svg>`;
}

// cols: [{ label, val(row) }]
export function exportCsv(name, cols, rows) {
   const esc = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // blocks spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
   };
   const csv = [
      cols.map((c) => esc(c.label)),
      ...rows.map((r) => cols.map((c) => esc(c.val(r)))),
   ]
      .map((l) => l.join(","))
      .join("\n");
   const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: name,
   });
   a.click();
   URL.revokeObjectURL(a.href);
}
