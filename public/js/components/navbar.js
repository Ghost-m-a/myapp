import { icons } from "../icons.js";
import { bus } from "../events.js";
import { subscribe, getState, setWorkspace } from "../store.js";
import { api } from "../services/api.js";
import { logout } from "../services/authService.js";
import { startSession } from "../services/session.js";
import { unreadBadge } from "../badges.js";
import { escapeHtml, initials, timeAgo } from "../utils.js";
import { getTheme, toggleTheme, LANGUAGES, applyLanguage } from "../theme.js";
import { avatarHTML } from "./avatar.js";

function loggedInHTML({ user, notifications, businesses, workspace }) {
   const unread = notifications.filter((n) => !n.read).length;
   const business = businesses.find((b) => b.id === workspace) || null;

   return `
    <div class="logged-in">
      ${business ? `<a href="#/developer" class="icon-btn hide-sm" aria-label="Developer">${icons.code}</a>` : ""}
      <a href="#/help" class="icon-btn hide-sm" aria-label="Help">${icons.help}</a>
      <a href="#/updates" class="icon-btn hide-sm" aria-label="What's new">${icons.sparkle}</a>
      <a href="#/messages" class="icon-btn" aria-label="Messages">${icons.messages}${unreadBadge()}</a>

      <div class="dropdown">
        <button class="icon-btn" data-action="toggle-dropdown" data-menu="notifications" aria-label="Notifications">
          ${icons.bell}${unread ? `<span class="badge">${unread > 9 ? "9+" : unread}</span>` : ""}
        </button>
        <div class="dropdown-menu notif-menu" hidden>
          <div class="dropdown-title">Notifications</div>
          ${
             notifications.length
                ? notifications
                     .map(
                        (n) => `
            <div class="notif-item ${n.read ? "" : "unread"}">
              ${escapeHtml(n.text)}<small>${timeAgo(n.createdAt)}</small>
            </div>`,
                     )
                     .join("")
                : `<p class="notif-empty">You're all caught up.</p>`
          }
        </div>
      </div>

      <a href="#/billing" class="credit-pill" title="Your credits">${icons.coin}<span>${user.credits}</span></a>

      <div class="dropdown">
        <button class="avatar-btn" data-action="toggle-dropdown" aria-label="User menu" aria-haspopup="true">
          ${avatarHTML(user)}
        </button>

        <div class="dropdown-menu user-menu" hidden>
          <div class="user-info">
            ${avatarHTML(user, "avatar-lg")}
            <div class="user-text">
              <strong>${escapeHtml(user.name)}</strong>
              <small>${escapeHtml(user.email)}</small>
            </div>
          </div>

          <div class="menu-ws">
            <p class="menu-title">Workspaces</p>
            <button class="menu-item ${business ? "" : "current"}" data-ws="personal">
              <span class="mi-icon">${icons.user}</span>Personal
            </button>
            ${businesses
               .map(
                  (b) => `
            <button class="menu-item ${b.id === workspace ? "current" : ""}" data-ws="${b.id}">
              <span class="mi-icon ws-mini">${escapeHtml(initials(b.name))}</span>${escapeHtml(b.name)}
            </button>`,
               )
               .join("")}
            <button class="menu-item" data-action="new-business">
              <span class="mi-icon">${icons.plus}</span>Start a business
            </button>
            <div class="menu-sep"></div>
          </div>

          <a href="#/resolution" class="menu-item"><span class="mi-icon">${icons.shield}</span>Resolution Center</a>
          <a href="#/orders" class="menu-item"><span class="mi-icon">${icons.orders}</span>Orders</a>
          <a href="#/settings" class="menu-item"><span class="mi-icon">${icons.settings}</span>Settings</a>
          <a href="#/help" class="menu-item"><span class="mi-icon">${icons.help}</span>Help &amp; Support</a>

          <div class="menu-item static">
            <span class="mi-icon">${icons.globe}</span>Language
            <select class="mi-select" data-action="language" aria-label="Language">
              ${Object.entries(LANGUAGES)
                 .map(
                    ([code, name]) =>
                       `<option value="${code}" ${code === user.language ? "selected" : ""}>${name}</option>`,
                 )
                 .join("")}
            </select>
          </div>

          <a href="#/legal" class="menu-item"><span class="mi-icon">${icons.legal}</span>Legal</a>

          <div class="menu-sep"></div>

          <div class="menu-item static">
            <span class="mi-icon">${icons.moon}</span>Dark Mode
            <button type="button" class="switch" role="switch" data-action="toggle-theme"
                    aria-label="Dark mode" aria-checked="${getTheme() === "dark"}"></button>
          </div>

          <div class="menu-sep"></div>

          <button class="menu-item danger" data-action="logout">
            <span class="mi-icon">${icons.logout}</span>Log Out
          </button>
        </div>
      </div>
    </div>`;
}

export function mountNavbar(el) {
   function render(state) {
      const business = state.businesses.find((b) => b.id === state.workspace);
      el.innerHTML = `
      <a href="#/home" class="logo">
        <span class="logo-mark">M</span>
        <span class="logo-text">MyApp</span>
      </a>

      <form class="search" data-role="search">
        ${icons.search}
        <input type="search" placeholder="${state.user && business ? `Search ${escapeHtml(business.name)}` : "Search"}" />
        <kbd>Ctrl+K</kbd>
      </form>

      <div class="nav-actions">
        ${state.user ? loggedInHTML(state) : `<button class="btn btn-primary" data-action="login">Log in</button>`}
      </div>`;
   }

   const closeDropdowns = () => {
      el.querySelectorAll(".dropdown-menu").forEach((m) => (m.hidden = true));
   };

   // Opening the bell marks everything as read (state is changed without a redraw,
   // so the menu stays open and still shows what was new)
   function markNotificationsRead() {
      const { notifications } = getState();
      if (!notifications.some((n) => !n.read)) return;
      notifications.forEach((n) => (n.read = true));
      el.querySelector('[data-menu="notifications"] .badge')?.remove();
      api("/notifications/read-all", { method: "POST" }).catch(() => {});
   }

   el.addEventListener("click", async (e) => {
      if (e.target.closest("a.menu-item")) closeDropdowns();

      const ws = e.target.closest("[data-ws]");
      if (ws) {
         setWorkspace(ws.dataset.ws);
         location.hash = "#/home";
         closeDropdowns();
         return;
      }

      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
         case "login":
            bus.emit("auth:open", "login");
            break;

         case "new-business":
            closeDropdowns();
            bus.emit("business:new");
            break;

         case "toggle-dropdown": {
            const menu = target.parentElement.querySelector(".dropdown-menu");
            const wasHidden = menu.hidden;
            closeDropdowns();
            menu.hidden = !wasHidden;
            if (target.dataset.menu === "notifications" && !menu.hidden)
               markNotificationsRead();
            break;
         }

         case "toggle-theme": {
            const next = toggleTheme();
            target.setAttribute("aria-checked", String(next === "dark"));
            getState().user.theme = next;
            api("/auth/me", { method: "PATCH", body: { theme: next } }).catch(
               () => {},
            );
            break;
         }

         case "logout":
            await logout();
            await startSession(null);
            location.hash = "";
            break;
      }
   });

   el.addEventListener("change", (e) => {
      const select = e.target.closest('[data-action="language"]');
      if (!select) return;
      getState().user.language = select.value;
      applyLanguage(select.value);
      api("/auth/me", {
         method: "PATCH",
         body: { language: select.value },
      }).catch(() => {});
   });

   el.addEventListener("submit", (e) => {
      if (!e.target.matches('[data-role="search"]')) return;
      e.preventDefault();
      const q = e.target.querySelector("input").value.trim();
      if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
   });

   document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown")) closeDropdowns();
   });

   document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDropdowns();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
         e.preventDefault();
         el.querySelector(".search input")?.focus();
      }
   });

   subscribe(render);
}
