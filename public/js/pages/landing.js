import { toast } from "../components/toast.js";
import { listRecords, createRecord } from "../services/biz.js";

const PAGES = {
   workforce: {
      kicker: "Workforce",
      title: "A global workforce, on demand.",
      feature: "workforce",
      button: "Join waitlist",
      points: [
         ["Create a bounty", "Hire anyone for any task, anywhere"],
         ["Watch the world work", "Watch workers through remote livestreams"],
         [
            "Pay only for approved results",
            "We review all entries, so you only pay for winners",
         ],
      ],
   },
   cards: {
      title: "Access your spending power, instantly",
      feature: "cards",
      button: "Apply for cards",
      points: [
         ["Spend instantly", "Use your pending balance right away"],
         ["Team cards", "Issue cards to team members with spend controls"],
         ["Fee rebates", "Earn a rebate on payment processing fees"],
      ],
   },
};

export function renderLanding(el, { business, path }) {
   const cfg = PAGES[path];
   let alive = true,
      joined = false;

   function paint() {
      el.innerHTML = `
      <div class="feature">
        ${cfg.kicker ? `<p class="kicker">${cfg.kicker}</p>` : ""}
        <h1>${cfg.title}</h1>
        <div class="feature-grid">${cfg.points.map(([t, d]) => `<div class="panel"><b>${t}</b><p class="muted">${d}</p></div>`).join("")}</div>
        <button class="btn btn-blue" id="join" ${joined ? "disabled" : ""}>${joined ? (path === "cards" ? "Application received" : "You're on the waitlist") : cfg.button}</button>
      </div>`;
   }

   el.addEventListener("click", async (e) => {
      if (!e.target.closest("#join")) return;
      try {
         await createRecord(business.id, "waitlist", { feature: cfg.feature });
         joined = true;
         paint();
         toast(
            path === "cards"
               ? "Application received"
               : "You're on the waitlist",
         );
      } catch (err) {
         toast(err.message);
      }
   });

   paint();
   listRecords(business.id, "waitlist")
      .then((r) => {
         if (alive) {
            joined = r.some((x) => x.feature === cfg.feature);
            paint();
         }
      })
      .catch(() => {});
   return () => {
      alive = false;
   };
}
