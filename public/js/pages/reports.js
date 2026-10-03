import { escapeHtml } from "../utils.js";
import {
   getStats,
   listRecords,
   money,
   date,
   cap,
   exportCsv,
   areaChart,
   balanceSeries,
} from "../services/biz.js";

const RANGES = { "1M": 30, "6M": 180, "1Y": 365, ALL: 365 };

export function renderReports(el, { business }) {
   let alive = true;
   let range = "6M";

   async function load() {
      try {
         const s = await getStats(business.id, RANGES[range]);
         if (!alive) return;
         const w = s.window;

         el.innerHTML = `
        <div class="page wide">
          <a class="muted-s" href="#/analytics">‹ Analytics</a>
          <h1>Net cashflow</h1>
          <h2 class="big">${money(w.in - w.out)}</h2>
          ${areaChart(balanceSeries(s))}
          <div class="toolbar">
            <div class="seg" id="ranges">${Object.keys(RANGES)
               .map(
                  (r) =>
                     `<button data-r="${r}" class="${r === range ? "on" : ""}">${r}</button>`,
               )
               .join("")}</div>
            <button class="btn btn-outline btn-sm" id="dl">Download statements and activity</button>
          </div>
          <div class="panel"><b>Starting balance</b><br />${money(w.start)}</div>
          <div class="two">
            <div class="panel"><b>Money in</b><br />${money(w.in)}</div>
            <div class="panel"><b>Money out</b><br />-${money(w.out)}</div>
            <div class="panel"><b>Deposits</b><br />${money(w.deposits)}</div>
            <div class="panel"><b>Withdrawals</b><br />${money(w.withdrawals)}</div>
          </div>
          <div class="panel"><b>Ending balance</b><br />${money(s.balance)}</div>
        </div>`;
      } catch (err) {
         if (alive)
            el.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`;
      }
   }

   el.addEventListener("click", async (e) => {
      const r = e.target.closest("[data-r]");
      if (r) {
         range = r.dataset.r;
         load();
      }

      if (e.target.closest("#dl")) {
         const rows = await listRecords(business.id, "payment");
         exportCsv(
            "statement.csv",
            [
               { label: "Date", val: (x) => date(x.createdAt) },
               { label: "Type", val: (x) => cap(x.type) },
               {
                  label: "Amount",
                  val: (x) => (x.type === "withdrawal" ? -x.amount : x.amount),
               },
               { label: "Status", val: (x) => x.status },
               { label: "Email", val: (x) => x.email || "" },
            ],
            rows,
         );
      }
   });

   load();
   return () => {
      alive = false;
   };
}
