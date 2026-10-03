import { escapeHtml } from "../utils.js";

// Shows the picture if there is one, otherwise the first letter of the name
export function avatarHTML(user, size = "") {
   const cls = `avatar ${size}`.trim();

   if (user.avatar && user.avatar.startsWith("data:image/")) {
      return `<span class="${cls}" style="background-image:url('${escapeHtml(user.avatar)}')"></span>`;
   }
   return `<span class="${cls}">${escapeHtml(user.name.trim().charAt(0))}</span>`;
}
