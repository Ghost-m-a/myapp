import { subscribe, getState } from "../store.js";
import { currentRoute } from "../router.js";
import { renderHome } from "../pages/home.js";
import { renderSettings } from "../pages/settings.js";
import { renderSearch } from "../pages/search.js";
import { renderBilling } from "../pages/billing.js";
import { renderMessages } from "../pages/messages.js";
import { renderTownhall } from "../pages/townhall.js";
import { renderPartners } from "../pages/partners.js";
import { renderAffiliates } from "../pages/affiliates.js";
import { renderDiscover } from "../pages/discover.js";
import { renderRewards } from "../pages/rewards.js";
import { renderPlaceholder } from "../pages/placeholder.js";
import { renderBizHome } from "../pages/bizHome.js";
import { renderAnalytics } from "../pages/analytics.js";
import { renderReports } from "../pages/reports.js";
import { renderCustomers } from "../pages/customers.js";
import { renderWebsites } from "../pages/websites.js";
import { renderLanding } from "../pages/landing.js";
import { renderBizAffiliates } from "../pages/bizAffiliates.js";
import { renderRecords } from "../pages/records.js";

// Pages that exist in every workspace
const shared = {
   settings: renderSettings,
   search: renderSearch,
   billing: renderBilling,
   messages: renderMessages,
   townhall: renderTownhall,
   partners: renderPartners,
   discover: renderDiscover,
   rewards: renderRewards,
};

const personal = { ...shared, home: renderHome, affiliates: renderAffiliates };

const business = {
   ...shared,
   home: renderBizHome,
   analytics: renderAnalytics,
   reports: renderReports,
   customers: renderCustomers,
   websites: renderWebsites,
   workforce: renderLanding,
   cards: renderLanding,
   affiliates: renderBizAffiliates,
   products: renderRecords,
   payments: renderRecords,
   checkout: renderRecords,
   invoices: renderRecords,
   promos: renderRecords,
   ads: renderRecords,
   team: renderRecords,
   subaccounts: renderRecords,
   support: renderRecords,
};

export function mountView(el) {
   const main = el.closest(".main");
   let cleanup = null;

   function render() {
      cleanup?.();
      cleanup = null;

      const { user, businesses, workspace } = getState();
      el.hidden = !user;
      if (!user) {
         el.innerHTML = "";
         main.classList.remove("flush");
         return;
      }

      const { path, query } = currentRoute();
      if (path === "community") {
         location.hash = "#/townhall";
         return;
      }
      main.classList.toggle("flush", path === "messages"); // chat uses the full area

      const biz = businesses.find((b) => b.id === workspace) || null;
      const page = (biz ? business : personal)[path] || renderPlaceholder;
      cleanup =
         page(el, { user, business: biz, businesses, query, path }) || null;
   }

   subscribe(render);
   addEventListener("hashchange", render);
}
