import { api } from "../services/api.js";
import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { toast } from "../components/toast.js";
import { openForm, openDialog } from "../components/formModal.js";
import { money, cap } from "../services/biz.js";

const CATS = ["gaming", "technology", "finance", "lifestyle", "music", "other"];
const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const FIELDS = [
   {
      name: "businessId",
      label: "Business",
      type: "ref",
      ref: "business",
      required: true,
   },
   {
      name: "title",
      label: "Campaign title",
      type: "string",
      required: true,
      max: 80,
   },
   { name: "description", label: "Description", type: "text", max: 500 },
   {
      name: "category",
      label: "Category",
      type: "enum",
      options: CATS,
      default: "other",
   },
   {
      name: "cpm",
      label: "Pay per 1K views (USD)",
      type: "number",
      required: true,
      min: 0.01,
      max: 1000,
   },
   {
      name: "budget",
      label: "Total budget (USD)",
      type: "number",
      required: true,
      min: 1,
      max: 1000000,
   },
   {
      name: "platforms",
      label: "Platforms",
      type: "multi",
      options: ["tiktok", "instagram", "youtube", "x"],
   },
];

const card = (c) => {
   const h = hue(c.title);
   const pct = Math.min(100, (c.spent / c.budget) * 100);
   return `
    <article class="camp" data-id="${c.id}">
      <div class="camp-banner" style="background:linear-gradient(135deg,hsl(${h} 70% 42%),hsl(${(h + 60) % 360} 70% 22%))">${escapeHtml(c.title)}</div>
      <div class="camp-body">
        <small class="muted-s">${escapeHtml(c.business?.name || "")} · ${c.platforms.map(cap).join(", ")}</small>
        <b>${escapeHtml(c.title)}</b>
        <div class="camp-meta"><span>${money(c.spent)} / ${money(c.budget)}</span><span class="pill">${money(c.cpm)}/1K</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <small class="muted-s">${c.participants} participant${c.participants === 1 ? "" : "s"}</small>
      </div>
    </article>`;
};

export function renderRewards(el, { businesses }) {
   let alive = true,
      items = [],
      q = "",
      sort = "newest",
      timer;

   el.innerHTML = `
    <div class="page wide rw">
      <header class="rw-head">
        <a class="icon-btn" href="#/discover" aria-label="Back">${icons.back}</a>
        <h1>Discover Content Rewards</h1>
        ${businesses.length ? `<button class="btn btn-primary" id="newCamp">${icons.plus} Create campaign</button>` : ""}
      </header>
      <div class="toolbar">
        <label class="chat-search narrow">${icons.search}<input id="rq" placeholder="Search campaigns..." /></label>
        <select id="rs" class="mini-select"><option value="newest">Newest</option><option value="cpm">Highest CPM</option><option value="budget">Biggest budget</option></select>
      </div>
      <div class="camp-grid" id="camps"></div>
    </div>`;

   const grid = el.querySelector("#camps");
   const paint = () => {
      grid.innerHTML =
         items.map(card).join("") ||
         `<div class="empty"><h3>No campaigns yet</h3><p class="muted">Create the first one from a business workspace.</p></div>`;
   };

   async function load() {
      try {
         const { campaigns } = await api(
            `/rewards?q=${encodeURIComponent(q)}&sort=${sort}`,
         );
         if (alive) {
            items = campaigns;
            paint();
         }
      } catch (err) {
         if (alive)
            grid.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`;
      }
   }

   function detail(c) {
      const { box, close } = openDialog(`
      <h2>${escapeHtml(c.title)}</h2>
      <p class="muted-s">${escapeHtml(c.business?.name || "")} · ${cap(c.category)} · ${c.platforms.map(cap).join(", ")}</p>
      <p>${escapeHtml(c.description || "No description provided.")}</p>
      <div class="two">
        <div class="panel"><small class="muted-s">Per 1K views</small><br /><b>${money(c.cpm)}</b></div>
        <div class="panel"><small class="muted-s">Budget</small><br /><b>${money(c.budget)}</b> <small class="muted-s">(${money(c.budget - c.spent)} remaining)</small></div>
      </div>
      <p class="muted-s">${c.participants} participant${c.participants === 1 ? "" : "s"}. Clip submissions and payouts aren't tracked yet.</p>
      ${
         c.mine
            ? `<button class="btn btn-danger btn-block" id="del">Delete campaign</button>`
            : `<button class="btn btn-primary btn-block" id="join">${c.joined ? "Leave campaign" : "Join campaign"}</button>`
      }`);

      box.querySelector("#join")?.addEventListener("click", async () => {
         try {
            const r = await api(`/rewards/${c.id}/join`, { method: "POST" });
            toast(
               r.joined ? "You joined the campaign" : "You left the campaign",
            );
            close();
            load();
         } catch (err) {
            toast(err.message);
         }
      });
      box.querySelector("#del")?.addEventListener("click", async () => {
         if (!confirm("Delete this campaign?")) return;
         try {
            await api(`/rewards/${c.id}`, { method: "DELETE" });
            close();
            load();
         } catch (err) {
            toast(err.message);
         }
      });
   }

   grid.addEventListener("click", (e) => {
      const a = e.target.closest("[data-id]");
      if (a) detail(items.find((c) => c.id === a.dataset.id));
   });

   el.querySelector("#newCamp")?.addEventListener("click", () =>
      openForm({
         title: "Create campaign",
         fields: FIELDS,
         refs: {
            business: businesses.map((b) => ({ id: b.id, name: b.name })),
         },
         values: { platforms: ["tiktok"] },
         submitLabel: "Create campaign",
         onSubmit: async (v) => {
            await api("/rewards", { method: "POST", body: v });
            toast("Campaign created");
            load();
         },
      }),
   );

   el.querySelector("#rq").addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
         q = e.target.value.trim();
         load();
      }, 300);
   });
   el.querySelector("#rs").addEventListener("change", (e) => {
      sort = e.target.value;
      load();
   });

   load();
   return () => {
      alive = false;
      clearTimeout(timer);
   };
}
