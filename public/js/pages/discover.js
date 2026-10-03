import { api } from "../services/api.js";
import { bus } from "../events.js";
import { icons } from "../icons.js";
import { escapeHtml, initials } from "../utils.js";

const ideas = [
   "Start a vintage sneaker marketplace",
   "Launch a fitness coaching community",
   "Sell my design templates",
   "Build a trading signals group",
];

const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const bizCard = (b) => {
   const h = hue(b.name);
   return `
    <article class="biz">
      <div class="biz-banner" style="background:linear-gradient(135deg,hsl(${h} 70% 48%),hsl(${(h + 50) % 360} 70% 30%))">${escapeHtml(initials(b.name))}</div>
      <div class="biz-info">
        <b>${escapeHtml(b.name)}</b>
        <small class="muted-s block">by ${escapeHtml(b.owner?.name || "Unknown")}</small>
        <p>${escapeHtml(b.description || "No description yet.")}</p>
      </div>
    </article>`;
};

export function renderDiscover(el) {
   let alive = true;
   let tab = "launch";
   let stats = { users: 0, businesses: 0, earned: 0 };
   let businesses = [];
   let q = "";
   let ideaTimer, searchTimer;

   async function load() {
      try {
         const data = await api(`/discover?q=${encodeURIComponent(q)}`);
         if (!alive) return;
         if (!q) stats = data.stats;
         businesses = data.businesses;
         paint(false);
      } catch {}
   }

   function paint(full = true) {
      if (!full && tab === "discover") {
         el.querySelector("#grid").innerHTML = grid();
         return;
      }
      clearInterval(ideaTimer);

      el.innerHTML = `
      <div class="discover">
        <div class="seg center" id="dTabs">
          <button data-t="launch" class="${tab === "launch" ? "on" : ""}">Launch</button>
          <button data-t="discover" class="${tab === "discover" ? "on" : ""}">Discover</button>
        </div>
        ${tab === "launch" ? launch() : browse()}
      </div>`;

      if (tab === "launch") {
         const box = el.querySelector("#idea");
         let i = 0;
         ideaTimer = setInterval(() => {
            i = (i + 1) % ideas.length;
            box.placeholder = ideas[i];
         }, 3000);
      }
   }

   const launch = () => `
    <h1 class="hero">Where the internet<br />does business.</h1>
    <p class="muted center">Build your business and get discovered by people on MyApp.</p>
    <form class="idea-box" id="ideaForm">
      <textarea id="idea" rows="2" placeholder="${ideas[0]}"></textarea>
      <button class="btn btn-primary" aria-label="Search">${icons.send}</button>
    </form>
    <p class="stats center"><b>$${stats.earned.toLocaleString()}</b> earned · <b>${stats.users.toLocaleString()}</b> users · <b>${stats.businesses.toLocaleString()}</b> businesses</p>

    <h2>Getting started</h2>
    <div class="start-cards">
      <button class="start orange" data-go="new"><b>Start a business</b><span>Create a workspace for your products</span></button>
      <button class="start dark" data-go="invite"><b>Invite friends</b><span>Earn by referring users and businesses</span></button>
      <button class="start rose" data-go="rewards"><b>Content Rewards</b><span>Get paid to create content for top brands</span></button>
    </div>

    <div class="row-head"><h2>New businesses</h2>
      <div><button class="icon-btn" data-scroll="-1" aria-label="Previous">${icons.back}</button>
      <button class="icon-btn" data-scroll="1" aria-label="Next">${icons.chevronRight}</button></div></div>
    <div class="biz-row" id="bizRow">${businesses.map(bizCard).join("") || `<p class="notif-empty">No businesses yet. Start the first one!</p>`}</div>`;

   const grid = () =>
      businesses.map(bizCard).join("") ||
      `<p class="notif-empty">Nothing found.</p>`;

   const browse = () => `
    <label class="chat-search wide-s">${icons.search}<input id="bizSearch" value="${escapeHtml(q)}" placeholder="Search businesses..." /></label>
    <div class="biz-grid" id="grid">${grid()}</div>`;

   el.addEventListener("click", (e) => {
      const t = e.target.closest("#dTabs [data-t]");
      if (t) {
         tab = t.dataset.t;
         paint();
         if (tab === "discover") el.querySelector("#bizSearch")?.focus();
      }
      const go = e.target.closest("[data-go]");
      if (go?.dataset.go === "rewards") location.hash = "#/rewards";
      if (go?.dataset.go === "new") bus.emit("business:new");
      if (go?.dataset.go === "invite") location.hash = "#/partners";
      const sc = e.target.closest("[data-scroll]");
      if (sc)
         el.querySelector("#bizRow").scrollBy({
            left: 400 * Number(sc.dataset.scroll),
            behavior: "smooth",
         });
   });

   el.addEventListener("submit", (e) => {
      if (!e.target.matches("#ideaForm")) return;
      e.preventDefault();
      q = el.querySelector("#idea").value.trim().slice(0, 40);
      tab = "discover";
      paint();
      load();
   });

   el.addEventListener("input", (e) => {
      if (e.target.id !== "bizSearch") return;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
         q = e.target.value.trim();
         load();
      }, 300);
   });

   paint();
   load();

   return () => {
      alive = false;
      clearInterval(ideaTimer);
      clearTimeout(searchTimer);
   };
}
