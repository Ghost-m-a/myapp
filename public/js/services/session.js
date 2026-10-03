import { api } from "./api.js";
import { setState } from "../store.js";
import { setTheme, applyLanguage } from "../theme.js";
import { setUnread, refreshUnread } from "../badges.js";

export async function startSession(user) {
   if (!user) {
      setUnread(0);
      return setState({
         user: null,
         businesses: [],
         notifications: [],
         workspace: "personal",
      });
   }

   const [{ businesses }, { notifications }] = await Promise.all([
      api("/businesses"),
      api("/notifications"),
   ]);

   const saved = localStorage.getItem("workspace");
   const workspace = businesses.some((b) => b.id === saved)
      ? saved
      : "personal";

   if (user.theme) setTheme(user.theme);
   applyLanguage(user.language);

   setState({ user, businesses, notifications, workspace });
   refreshUnread();
}

export async function refreshNotifications() {
   const { notifications } = await api("/notifications");
   setState({ notifications });
}
