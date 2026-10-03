import { icons } from "../icons.js";
import { api } from "../services/api.js";
import { escapeHtml } from "../utils.js";
import { toast } from "../components/toast.js";
import { openForm } from "../components/formModal.js";
import {
   getSpec,
   listRecords,
   createRecord,
   getStats,
   money,
   areaChart,
   balanceSeries,
} from "../services/biz.js";

export function renderBizHome(el, { user, business }) {
   let alive = true;
   const bid = business.id;

   async function load() {
      try {
         const s = await getStats(bid, 14);
         if (!alive) return;

         el.innerHTML = `
        <div class="dash-grid">
          <div class="dash-left">
            <p class="dash-kicker">Total balance · ${escapeHtml(business.name)}</p>
            <h1 class="dash-balance">${money(s.balance)}</h1>
            ${areaChart(balanceSeries(s))}

            <div class="home-actions">
              <button class="btn btn-outline" data-act="deposit">${icons.download} Deposit</button>
              <button class="btn btn-outline" data-act="accept">${icons.card} Accept</button>
              <button class="btn btn-outline" data-act="send">${icons.send} Send</button>
            </div>

            <div class="intel">
              <p>${escapeHtml(business.name)} can grow <b>3x faster</b> with Economic Intelligence.</p>
              <div class="intel-row">
                <span>${icons.bolt} <span id="intelLabel">${user.economicIntel ? "Turned on" : "Turn on"}</span></span>
                <button type="button" class="switch" role="switch" id="intelSwitch" aria-checked="${Boolean(user.economicIntel)}" aria-label="Economic Intelligence"></button>
              </div>
            </div>
          </div>

          <div class="dash-right">
            <section class="panel">
              <a class="panel-title" href="#/websites"><h3>Websites ${icons.chevronRight}</h3></a>
              ${
                 s.counts.website
                    ? `<p>${s.counts.website} website${s.counts.website === 1 ? "" : "s"}</p>`
                    : `<p><b>No website yet</b></p><p class="muted">Create a website to take payments and increase sales.</p>
                     <a class="link-btn" href="#/websites">+ Add a website</a>`
              }
            </section>
            <section class="panel">
              <h3>Balances</h3>
              <a href="#/reports" class="balance-row"><span class="avatar ws-avatar">$</span><span class="balance-name">USD</span><strong>${money(s.balance)}</strong>${icons.chevronRight}</a>
            </section>
          </div>
        </div>`;
      } catch (err) {
         if (alive)
            el.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`;
      }
   }

   const amountField = [
      {
         name: "amount",
         label: "Amount (USD)",
         type: "number",
         required: true,
         min: 0.01,
         max: 1000000,
      },
   ];

   el.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;

      if (btn.dataset.act === "deposit" || btn.dataset.act === "send") {
         const type = btn.dataset.act === "deposit" ? "deposit" : "withdrawal";
         openForm({
            title: type === "deposit" ? "Deposit" : "Send money",
            intro: "This records the movement in your balance. No real bank transfer happens yet.",
            fields: amountField,
            submitLabel: type === "deposit" ? "Deposit" : "Send",
            onSubmit: async (v) => {
               await createRecord(bid, "payment", {
                  amount: v.amount,
                  type,
                  method: "bank",
                  status: "succeeded",
               });
               toast(
                  type === "deposit"
                     ? "Deposit recorded"
                     : "Withdrawal recorded",
               );
               load();
            },
         });
      }

      if (btn.dataset.act === "accept") {
         const spec = await getSpec();
         const products = (await listRecords(bid, "product")).map((p) => ({
            id: p.id,
            name: p.name,
         }));
         openForm({
            title: "Accept a payment",
            intro: "Record a payment you received. Real card processing isn't connected yet.",
            fields: spec.payment.fields,
            refs: { product: products },
            submitLabel: "Record payment",
            onSubmit: async (v) => {
               await createRecord(bid, "payment", v);
               toast("Payment recorded");
               load();
            },
         });
      }
   });

   el.addEventListener("click", (e) => {
      const sw = e.target.closest("#intelSwitch");
      if (!sw) return;
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      el.querySelector("#intelLabel").textContent = on
         ? "Turned on"
         : "Turn on";
      user.economicIntel = on;
      api("/auth/me", { method: "PATCH", body: { economicIntel: on } }).catch(
         () => {},
      );
   });

   load();
   return () => {
      alive = false;
   };
}
