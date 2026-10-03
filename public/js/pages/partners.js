import { api } from "../services/api.js";
import { icons } from "../icons.js";
import { escapeHtml, copyText, referralLink } from "../utils.js";
import { avatarHTML } from "../components/avatar.js";
import { toast } from "../components/toast.js";

const date = (d) =>
   new Date(d).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
   });

const resources = [
   ["General overview", "help", "book"],
   ["Cards", "cards", "cards"],
   ["Payments", "payments", "card"],
   ["Ads", "ads", "megaphone"],
   ["Affiliates", "affiliates", "affiliates"],
   ["Support", "support", "support"],
];

// Sample data until payments exist
const topEarners = [
   ["A partner somewhere", "$77.7K"],
   ["A partner somewhere", "$73.4K"],
   ["A partner in Tampa, US", "$36.8K"],
   ["A partner in Miami, US", "$35.5K"],
   ["A partner in New York City, US", "$32K"],
];

export function renderPartners(el, { user }) {
   let alive = true;
   el.innerHTML = `<p class="notif-empty">Loading...</p>`;

   api("/partners/me")
      .then((data) => alive && paint(data))
      .catch(
         (err) =>
            alive &&
            (el.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`),
      );

   function paint(data) {
      let tab = "businesses";
      let q = "";
      const link = referralLink(data.referralCode);

      el.innerHTML = `
      <div class="partners">
        <div class="p-left">
          <p class="dash-kicker">Total earnings</p>
          <h1 class="dash-balance">$${data.earnings.toFixed(2)}</h1>
          <svg class="dash-chart" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 190 C200 188 320 170 420 120 S560 30 600 20 L600 200 L0 200Z" fill="#9ca3af" fill-opacity="0.25" />
            <path d="M0 190 C200 188 320 170 420 120 S560 30 600 20" fill="none" stroke="#9ca3af" stroke-width="1.5" vector-effect="non-scaling-stroke" />
          </svg>

          <div class="ref-head">
            <h3>Your referrals</h3>
            <div class="seg" id="refSeg">
              <button data-t="businesses" class="on">Businesses</button>
              <button data-t="users">Users</button>
            </div>
          </div>
          <label class="chat-search narrow">${icons.search}<input id="refSearch" placeholder="Search..." /></label>
          <div class="table-wrap"><table id="refTable"></table></div>
        </div>

        <div class="p-right">
          <section class="panel">
            <div class="p-profile">
              ${avatarHTML(user, "avatar-lg")}
              <div><b>${escapeHtml(user.name)}</b><small class="muted-s block">${data.enrolled ? "Verified Partner" : "Partner"}</small></div>
            </div>
            <div class="p-stats">
              <div><strong>$${data.earnings}</strong><small>Total earned</small></div>
              <div><strong>${data.users.length}</strong><small>Referred users</small></div>
            </div>
            <div class="p-buttons">
              <a class="btn btn-primary" href="mailto:?subject=${encodeURIComponent("Join me on MyApp")}&body=${encodeURIComponent("Sign up with my link: " + link)}">${icons.mail} Email invite</a>
              <button class="btn btn-outline" id="copyLink">${icons.link} Copy link</button>
            </div>
          </section>

          <section class="panel">
            <h3>${data.enrolled ? "You're a Verified Partner" : "Become a Verified Partner"}</h3>
            <ul class="checks">
              <li>${icons.check} Adjust fees for your referred businesses</li>
              <li>${icons.check} Attribute deals without a referral link</li>
              <li>${icons.check} Join a private network of partners</li>
            </ul>
            <button class="btn btn-blue btn-block" id="enroll" ${data.enrolled ? "disabled" : ""}>${data.enrolled ? "Enrolled" : "Enroll"}</button>
          </section>

          <section class="panel">
            <h3>Partner resources</h3>
            <div class="res-grid">
              ${resources.map(([n, p, i]) => `<a href="#/${p}" class="res">${icons[i] || icons.sparkle}${n}</a>`).join("")}
            </div>
          </section>

          <section class="panel">
            <h3>Top earners last 30 days <i class="live-dot"></i></h3>
            <ol class="top">${topEarners.map(([n, v], i) => `<li><span>${i + 1}</span>${n}<b>${v}</b></li>`).join("")}</ol>
            <small class="muted-s">Sample data</small>
          </section>
        </div>
      </div>`;

      const table = el.querySelector("#refTable");
      function paintTable() {
         const s = q.toLowerCase();
         if (tab === "businesses") {
            const rows = data.businesses.filter((b) =>
               b.name.toLowerCase().includes(s),
            );
            table.innerHTML = `<thead><tr><th>Business</th><th>Volume (30d)</th><th>Your earnings</th><th>Referred user</th><th>Joined on</th></tr></thead>
          <tbody>${
             rows
                .map(
                   (b) =>
                      `<tr><td>${escapeHtml(b.name)}</td><td>$0</td><td>$0</td><td>${escapeHtml(b.owner?.name || "-")}</td><td>${date(b.createdAt)}</td></tr>`,
                )
                .join("") ||
             `<tr><td colspan="5" class="table-empty">Refer businesses and see their performance here.</td></tr>`
          }</tbody>`;
         } else {
            const rows = data.users.filter((u) =>
               u.name.toLowerCase().includes(s),
            );
            table.innerHTML = `<thead><tr><th>User</th><th>Account type</th><th>Joined on</th></tr></thead>
          <tbody>${
             rows
                .map(
                   (u) =>
                      `<tr><td>${escapeHtml(u.name)}</td><td>${u.role === "advertiser" ? "Advertiser" : "Creator"}</td><td>${date(u.createdAt)}</td></tr>`,
                )
                .join("") ||
             `<tr><td colspan="3" class="table-empty">Share your link to refer users.</td></tr>`
          }</tbody>`;
         }
      }
      paintTable();

      el.querySelector("#refSeg").addEventListener("click", (e) => {
         const b = e.target.closest("[data-t]");
         if (!b) return;
         tab = b.dataset.t;
         el.querySelectorAll("#refSeg button").forEach((x) =>
            x.classList.toggle("on", x === b),
         );
         paintTable();
      });
      el.querySelector("#refSearch").addEventListener("input", (e) => {
         q = e.target.value;
         paintTable();
      });
      el.querySelector("#copyLink").addEventListener("click", async () => {
         toast(
            (await copyText(link)) ? "Referral link copied" : "Could not copy",
         );
      });
      el.querySelector("#enroll").addEventListener("click", async (e) => {
         try {
            await api("/partners/enroll", { method: "POST" });
            data.enrolled = true;
            e.target.textContent = "Enrolled";
            e.target.disabled = true;
            toast("You're now a Verified Partner");
         } catch (err) {
            toast(err.message);
         }
      });
   }

   return () => {
      alive = false;
   };
}
