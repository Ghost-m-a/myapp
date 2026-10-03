import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { getStats, money, areaChart } from "../services/biz.js";

export function renderAnalytics(el, { business }) {
   let alive = true;
   el.innerHTML = `<p class="notif-empty">Loading...</p>`;

   getStats(business.id, 14)
      .then((s) => {
         if (!alive) return;
         const net = s.series.map((d) => d.in - d.out);
         const gtv = s.series.map((d) => d.in);
         const ads = s.counts.ad || 0;

         el.innerHTML = `
        <div class="page wide">
          <h1>Analytics</h1>
          <div class="an-grid">
            <section class="panel span2">
              <p class="muted-s">Profit · last 14 days</p>
              <h2 class="big">${money(s.window.in - s.window.out)}</h2>
              ${areaChart(net)}
              <p class="muted-s"><span class="dotg"></span> Money in ${money(s.window.in)} &nbsp; <span class="dotr"></span> Money out ${money(s.window.out)}</p>
            </section>

            <section class="panel">
              <h3>Cashflow</h3>
              <div class="cf"><span>${icons.card}</span><div><b>Payments</b><small>${s.payments} payment${s.payments === 1 ? "" : "s"}</small></div><a class="btn btn-sm btn-outline" href="#/payments">Accept a payment</a></div>
              <div class="cf"><span>${icons.cards}</span><div><b>Card spend</b><small>0 transactions</small></div><a class="btn btn-sm btn-outline" href="#/cards">Get a card</a></div>
              <div class="cf"><span>${icons.megaphone}</span><div><b>Ads</b><small>${ads} campaign${ads === 1 ? "" : "s"}</small></div><a class="btn btn-sm btn-outline" href="#/ads">Run ads</a></div>
              <a class="link-btn" href="#/reports">View cashflow report ${icons.arrowRight}</a>
            </section>
          </div>

          <div class="stat-row">
            <div class="panel"><small>Ad spend</small><b>${money(0)}</b></div>
            <div class="panel"><small>Visitors</small><b>--</b></div>
            <div class="panel"><small>Successful payments</small><b>${s.payments}</b></div>
            <div class="panel"><small>Customers</small><b>${s.customers}</b></div>
          </div>

          <div class="an-grid">
            <section class="panel span2">
              <p class="muted-s">Gross transaction value</p>
              <h2 class="big">${money(s.revenue)}</h2>
              <p class="muted-s">Today ${money(s.today)}</p>
              ${areaChart(gtv)}
            </section>
            <section class="panel">
              <h3>Live events</h3>
              <p class="muted">No website connected.</p>
              <a class="btn btn-sm btn-outline" href="#/websites">Add website</a>
            </section>
          </div>

          <div class="an-grid three">
            <section class="panel"><h3>Top sources</h3><p class="muted">No website connected.</p></section>
            <section class="panel"><h3>Traffic over time</h3><p class="muted">No website connected.</p></section>
            <section class="panel"><p class="muted-s">Avg revenue per customer</p><h2 class="big">${money(s.avg)}</h2></section>
          </div>
        </div>`;
      })
      .catch(
         (err) =>
            alive &&
            (el.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`),
      );

   return () => {
      alive = false;
   };
}
