import { icons } from "../icons.js";
import { api } from "../services/api.js";
import { escapeHtml } from "../utils.js";
import { money, date, exportCsv } from "../services/biz.js";

export function renderCustomers(el, { business }) {
   let alive = true,
      rows = [],
      q = "";
   const cols = [
      { label: "Customer", val: (r) => r.email },
      { label: "Status", val: () => "Joined" },
      { label: "Total spend", val: (r) => money(r.spend) },
      { label: "Payments", val: (r) => r.payments },
      { label: "Joined at", val: (r) => date(r.joined) },
      { label: "Last payment", val: (r) => date(r.last) },
   ];

   el.innerHTML = `
    <div class="page wide">
      <h1>Customers</h1>
      <div class="toolbar">
        <label class="chat-search narrow">${icons.search}<input id="q" placeholder="Search by email" /></label>
        <button class="btn btn-outline btn-sm" id="exp">${icons.download} Export</button>
      </div>
      <div class="table-wrap" id="table"></div>
    </div>`;

   const visible = () =>
      rows.filter((r) => r.email.toLowerCase().includes(q.toLowerCase()));
   function paint() {
      const list = visible();
      el.querySelector("#table").innerHTML = list.length
         ? `<table><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
         <tbody>${list.map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(c.val(r))}</td>`).join("")}</tr>`).join("")}</tbody></table>`
         : `<div class="empty"><h3>No customers yet</h3><p class="muted">People who pay you appear here automatically.</p></div>`;
   }

   el.querySelector("#q").addEventListener("input", (e) => {
      q = e.target.value;
      paint();
   });
   el.querySelector("#exp").addEventListener("click", () =>
      exportCsv("customers.csv", cols, visible()),
   );

   api(`/biz/${business.id}/customers`)
      .then((r) => {
         if (alive) {
            rows = r.customers;
            paint();
         }
      })
      .catch(
         (err) =>
            alive &&
            (el.querySelector("#table").innerHTML =
               `<p class="notif-empty">${escapeHtml(err.message)}</p>`),
      );

   return () => {
      alive = false;
   };
}
