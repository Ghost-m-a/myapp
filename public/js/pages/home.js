import { icons } from "../icons.js";
import { setWorkspace } from "../store.js";
import { escapeHtml, initials } from "../utils.js";
import { avatarHTML } from "../components/avatar.js";
import { api } from "../services/api.js";

// Sample live feed. Still fake data.
const pulseEvents = [
   {
      icon: "megaphone",
      before: "An affiliate just earned",
      amount: "$12.50",
      after: "",
      where: "Affiliates · Newark, United States",
   },
   {
      icon: "creators",
      before: "A nutrition creator just made a",
      amount: "$87.30",
      after: "sale",
      where: "Marketplace · Lahore, Pakistan",
   },
   {
      icon: "chart",
      before: "A venture just made a",
      amount: "$1,094",
      after: "sale",
      where: "Marketplace · London, United Kingdom",
   },
   {
      icon: "creators",
      before: "A business just made a",
      amount: "$5.83",
      after: "sale",
      where: "Marketplace · San Diego, United States",
   },
   {
      icon: "creators",
      before: "An operator just made a",
      amount: "$25",
      after: "sale",
      where: "Marketplace · Tampa, United States",
   },
   {
      icon: "megaphone",
      before: "An advertiser just launched a",
      amount: "$300",
      after: "campaign",
      where: "Campaigns · Cairo, Egypt",
   },
];

const pulseItem = (p) => `
  <li class="pulse-item">
    <span class="pulse-icon">${icons[p.icon]}</span>
    <div>
      <p>${p.before} <b class="money">${p.amount}</b> ${p.after}</p>
      <small>${p.where}</small>
    </div>
  </li>`;

export function renderHome(el, { user, business, businesses }) {
   const chip = business
      ? "Business"
      : user.role === "advertiser"
        ? "Advertiser"
        : "Content creator";

   el.innerHTML = `
    <div class="dash-grid">
      <div class="dash-left">
        <p class="dash-kicker">
          Total balance · ${business ? escapeHtml(business.name) : "All balances"}
          <span class="role-chip">${chip}</span>
        </p>
        <h1 class="dash-balance">$0.00</h1>

        <svg class="dash-chart" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#9ca3af" stop-opacity="0.35" />
              <stop offset="1" stop-color="#9ca3af" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 110 L50 125 L100 100 L150 80 L220 98 L280 70 L340 88 L400 55 L460 62 L520 40 L600 28 L600 200 L0 200Z" fill="url(#chartFill)" />
          <path d="M0 110 L50 125 L100 100 L150 80 L220 98 L280 70 L340 88 L400 55 L460 62 L520 40 L600 28"
                fill="none" stroke="#9ca3af" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        </svg>

                <div class="intel">
          <p>${business ? "Businesses" : "You"} grow <b>3x faster</b> with Economic Intelligence.</p>
          <div class="intel-row">
            <span>${icons.bolt} <span id="intelLabel">${user.economicIntel ? "Turned on" : "Turn on"}</span></span>
            <button type="button" class="switch" role="switch" id="intelSwitch"
                    aria-checked="${Boolean(user.economicIntel)}" aria-label="Economic Intelligence"></button>
          </div>
        </div>
      </div>

      <div class="dash-right">
        <section class="panel">
          <h3>Balances</h3>
          <button class="balance-row" data-ws="personal">
            ${avatarHTML(user)}
            <span class="balance-name">Personal</span>
            <strong>$0.00</strong>${icons.chevronRight}
          </button>
          ${businesses
             .map(
                (b) => `
          <button class="balance-row" data-ws="${b.id}">
            <span class="avatar ws-avatar">${escapeHtml(initials(b.name))}</span>
            <span class="balance-name">${escapeHtml(b.name)}</span>
            <strong>$0.00</strong>${icons.chevronRight}
          </button>`,
             )
             .join("")}
        </section>

        <section class="panel">
          <h3>Pulse <i class="live-dot"></i></h3>
          <ul class="pulse" id="pulseList">${pulseEvents.slice(0, 5).map(pulseItem).join("")}</ul>
        </section>
      </div>
    </div>`;

   // Clicking a balance row switches to that workspace
   el.querySelectorAll("[data-ws]").forEach((btn) =>
      btn.addEventListener("click", () => setWorkspace(btn.dataset.ws)),
   );
   const sw = el.querySelector("#intelSwitch");
   sw.addEventListener("click", async () => {
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
   let next = 5;
   const list = el.querySelector("#pulseList");
   const timer = setInterval(() => {
      list.insertAdjacentHTML(
         "afterbegin",
         pulseItem(pulseEvents[next++ % pulseEvents.length]),
      );
      if (list.children.length > 5) list.lastElementChild.remove();
   }, 4000);

   return () => clearInterval(timer);
}
