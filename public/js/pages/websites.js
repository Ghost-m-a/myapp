import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { toast } from "../components/toast.js";
import { openForm } from "../components/formModal.js";
import {
   getSpec,
   listRecords,
   createRecord,
   deleteRecord,
   cap,
} from "../services/biz.js";

const BLUEPRINTS = [
   "neobank",
   "ecommerce",
   "software",
   "agency",
   "service",
   "gym",
   "trading",
   "books",
];
const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const tile = (name) =>
   `hsl(${hue(name)} 60% 40%), hsl(${(hue(name) + 50) % 360} 60% 22%)`;

export function renderWebsites(el, { business }) {
   const bid = business.id;
   let alive = true,
      sites = [];

   function paint() {
      el.innerHTML = `
      <div class="page wide">
        <h1>Websites</h1>
        <section class="hero-card">
          <div><h2>Big ideas deserve a home.</h2>
            <p class="muted">Create something new or start with a blueprint.</p>
            <button class="btn btn-blue" data-new="blank">${icons.plus} New website</button></div>
        </section>
        ${
           sites.length
              ? `<h3>Your websites</h3><div class="bp-grid">${sites
                   .map(
                      (s) => `
          <div class="bp"><div class="bp-img" style="background:linear-gradient(135deg,${tile(s.blueprint)})">${escapeHtml(s.name.slice(0, 2).toUpperCase())}</div>
            <b>${escapeHtml(s.name)}</b><small class="muted-s">${cap(s.blueprint)} · Draft</small>
            <button class="icon-btn sm" data-del="${s.id}" aria-label="Delete website">${icons.trash}</button></div>`,
                   )
                   .join("")}</div>`
              : ""
        }
        <h3>Business blueprints</h3>
        <div class="bp-grid">${BLUEPRINTS.map(
           (b) => `
          <button class="bp" data-new="${b}"><div class="bp-img" style="background:linear-gradient(135deg,${tile(b)})">${cap(b)}</div><b>${cap(b)}</b></button>`,
        ).join("")}</div>
      </div>`;
   }

   async function open(blueprint) {
      const spec = await getSpec();
      openForm({
         title: "New website",
         fields: spec.website.fields,
         values: { blueprint },
         submitLabel: "Create website",
         onSubmit: async (v) => {
            await createRecord(bid, "website", v);
            sites = await listRecords(bid, "website");
            if (alive) paint();
            toast("Website created");
         },
      });
   }

   el.addEventListener("click", async (e) => {
      const n = e.target.closest("[data-new]");
      if (n) return open(n.dataset.new).catch((err) => toast(err.message));
      const d = e.target.closest("[data-del]");
      if (d && confirm("Delete this website?")) {
         await deleteRecord(bid, "website", d.dataset.del).catch((err) =>
            toast(err.message),
         );
         sites = sites.filter((s) => s.id !== d.dataset.del);
         paint();
      }
   });

   paint();
   listRecords(bid, "website")
      .then((r) => {
         if (alive) {
            sites = r;
            paint();
         }
      })
      .catch(() => {});
   return () => {
      alive = false;
   };
}
