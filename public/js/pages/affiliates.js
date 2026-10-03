import { api } from "../services/api.js";
import { icons } from "../icons.js";
import { escapeHtml, copyText, referralLink } from "../utils.js";
import { toast } from "../components/toast.js";

export function renderAffiliates(el) {
   let alive = true;
   let tab = "dashboard";
   let data = null;

   function paint() {
      el.innerHTML = `
      <div class="aff">
        <h1>Affiliates</h1>
        <div class="tabs-line" id="tabs">
          <button data-t="dashboard" class="${tab === "dashboard" ? "on" : ""}">Dashboard</button>
          <button data-t="refer" class="${tab === "refer" ? "on" : ""}">Refer buyers</button>
        </div>
        <div class="aff-body">${
           tab === "dashboard"
              ? `<div class="empty plain">
                 <span class="empty-icon">${icons.megaphone}</span>
                 <h3>You are not promoting any products yet</h3>
                 <p class="muted">Browse the marketplace to find products to promote.</p>
                 <a class="btn btn-blue" href="#/discover">Browse products</a>
               </div>`
              : data
                ? `<section class="panel refer">
                 <h3>Your referral link</h3>
                 <p class="muted">Anyone who signs up through this link is tracked as your referral.</p>
                 <div class="linkbox"><input readonly value="${escapeHtml(referralLink(data.referralCode))}" id="refLink" />
                   <button class="btn btn-primary" id="copy">${icons.link} Copy</button></div>
                 <p class="muted-s">${data.users.length} user${data.users.length === 1 ? "" : "s"} referred so far.</p>
               </section>`
                : `<p class="notif-empty">Loading...</p>`
        }</div>
      </div>`;
   }

   el.addEventListener("click", async (e) => {
      const t = e.target.closest("[data-t]");
      if (t) {
         tab = t.dataset.t;
         paint();
         if (tab === "refer" && !data) {
            try {
               data = await api("/partners/me");
               if (alive) paint();
            } catch (err) {
               toast(err.message);
            }
         }
      }
      if (e.target.closest("#copy")) {
         toast(
            (await copyText(el.querySelector("#refLink").value))
               ? "Link copied"
               : "Could not copy",
         );
      }
   });

   paint();
   return () => {
      alive = false;
   };
}
