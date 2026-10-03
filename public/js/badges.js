import { api } from "./services/api.js";

let unread = 0;
const label = () => (unread > 9 ? "9+" : String(unread));

export const getUnread = () => unread;

export function setUnread(n) {
   unread = n;
   document.querySelectorAll("[data-unread]").forEach((el) => {
      el.textContent = label();
      el.hidden = unread === 0;
   });
}

export const unreadBadge = (cls = "badge") =>
   `<span class="${cls}" data-unread ${unread ? "" : "hidden"}>${label()}</span>`;

export async function refreshUnread() {
   try {
      setUnread((await api("/messages/conversations")).unread);
   } catch {}
}
