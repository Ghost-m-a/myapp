import { icons } from "../icons.js";
import { bus } from "../events.js";
import { subscribe, getState, setWorkspace } from "../store.js";
import { getNav } from "../nav.js";
import { currentRoute } from "../router.js";
import { unreadBadge } from "../badges.js";
import { escapeHtml, initials } from "../utils.js";
import { avatarHTML } from "./avatar.js";

let moreOpen = false;
let lastPath = null;

const linkHTML = (item, active, extra = "") => `
  <a href="${item.href || `#/${item.path}`}" class="side-link ${active === item.path ? "active" : ""} ${extra}" title="${item.name}">
    <span class="side-icon">${icons[item.icon]}${item.path === "messages" ? unreadBadge("dot") : ""}</span>
    <span class="side-text">${item.name}</span>
    ${item.tag ? `<em class="tag">${item.tag}</em>` : ""}
    ${item.arrow ? `<span class="chev-r">${icons.arrowRight}</span>` : ""}
  </a>`;

function sectionHTML(section, active, isFirst) {
   if (section.more) {
      return `
      <div class="side-section">
        <button class="side-link side-more" data-action="more" aria-expanded="${moreOpen}">
          <span class="side-icon">${icons.dots}</span>
          <span class="side-text">More</span>
          <span class="chev">${icons.chevronDown}</span>
        </button>
        <div class="side-more-list" ${moreOpen ? "" : "hidden"}>
          ${section.items.map((i) => linkHTML(i, active)).join("")}
        </div>
      </div>`;
   }

   return `
    <div class="side-section">
      <p class="side-label">${escapeHtml(section.label)}</p>
      ${section.items.map((i, n) => linkHTML(i, active, isFirst && n < 5 ? "mob" : "")).join("")}
    </div>`;
}

export function mountSidebar(el) {
   el.className = "sidebar";

   function render() {
      const { user, businesses, workspace } = getState();
      el.hidden = !user;
      if (!user) {
         el.innerHTML = "";
         el.classList.remove("collapsed");
         return;
      }

      const business = businesses.find((b) => b.id === workspace) || null;
      const nav = getNav({ business, role: user.role });
      const { path } = currentRoute();

      // Open "More" when you navigate to one of its pages
      if (path !== lastPath) {
         lastPath = path;
         if (
            nav.sections.find((s) => s.more)?.items.some((i) => i.path === path)
         )
            moreOpen = true;
      }

      el.innerHTML = `
      <div class="workspaces">
        <button class="ws-tile ${business ? "" : "active"}" data-ws="personal" title="Personal" aria-label="Personal workspace">${icons.user}</button>
        ${businesses
           .map(
              (b) => `
        <button class="ws-tile ws-initials ${b.id === workspace ? "active" : ""}" data-ws="${b.id}"
                title="${escapeHtml(b.name)}" aria-label="${escapeHtml(b.name)}">${escapeHtml(initials(b.name))}</button>`,
           )
           .join("")}
        <button class="ws-tile ws-add" data-action="new-business" title="Start a business" aria-label="Start a business">${icons.plus}</button>
      </div>

      <nav class="side-nav">
        ${nav.sections.map((s, i) => sectionHTML(s, path, i === 0)).join("")}
        <a href="#/settings" class="side-link side-profile ${path === "settings" ? "active" : ""}" title="Profile">
          <span class="side-icon">${avatarHTML(user)}</span>
        </a>
      </nav>

      <div class="side-bottom">
        <div class="side-bottom-links">${nav.bottom.map((i) => linkHTML(i, path)).join("")}</div>
        <button class="icon-btn collapse-btn" data-action="collapse" aria-label="Collapse sidebar">${icons.panel}</button>
      </div>`;
   }

   el.addEventListener("click", (e) => {
      const ws = e.target.closest("[data-ws]");
      if (ws) {
         setWorkspace(ws.dataset.ws);
         location.hash = "#/home";
         return;
      }

      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      if (btn.dataset.action === "collapse") el.classList.toggle("collapsed");
      if (btn.dataset.action === "new-business") bus.emit("business:new");
      if (btn.dataset.action === "more") {
         moreOpen = !moreOpen;
         render();
      }
   });

   subscribe(render);
   addEventListener("hashchange", render); // keeps the active link in sync
}
