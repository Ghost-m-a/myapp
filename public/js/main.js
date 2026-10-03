import { $ } from "./utils.js";
import { initTheme } from "./theme.js";
import { getCurrentUser } from "./services/authService.js";
import { startSession } from "./services/session.js";

import { mountNavbar } from "./components/navbar.js";
import { mountSidebar } from "./components/sidebar.js";
import { mountLanding } from "./components/landing.js";
import { mountView } from "./components/view.js";
import { mountAuthModal } from "./components/authModal.js";
import { mountBusinessModal } from "./components/businessModal.js";

import { getState } from "./store.js";
import { refreshUnread } from "./badges.js";

async function start() {
   const ref = new URLSearchParams(location.search).get("ref");
   if (ref) {
      localStorage.setItem("ref", ref);
      history.replaceState(null, "", location.pathname + location.hash);
   }
   initTheme();

   // Ask the server who is logged in, then load their businesses and notifications
   try {
      await startSession(await getCurrentUser());
   } catch (err) {
      console.error(err);
      await startSession(null);
   }

   mountNavbar($("#navbar"));
   mountSidebar($("#sidebar"));
   mountLanding($("#landing"));
   mountView($("#view"));
   mountAuthModal($("#authModal"));
   mountBusinessModal();
   setInterval(() => {
      if (getState().user && !document.hidden) refreshUnread();
   }, 15000);
}

start();
