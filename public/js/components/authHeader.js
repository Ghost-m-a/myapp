import { icons } from "../icons.js";

export function authHeader(title, subtitle) {
   return `
    <div class="auth-header">
      <span class="auth-logo">${icons.logo}</span>
      <h2>${title}</h2>
      <p>${subtitle}</p>
    </div>`;
}
