import { icons } from "../icons.js";

export function passwordField({
   label = "Password",
   name = "password",
   placeholder = "Password",
   minlength = 0,
   autocomplete = "current-password",
} = {}) {
   return `
    <label class="field-label">${label}
      <span class="input-wrap has-action">
        <span class="input-icon">${icons.lock}</span>
        <input type="password" name="${name}" placeholder="${placeholder}"
               autocomplete="${autocomplete}"
               ${minlength ? `minlength="${minlength}"` : ""} required />
        <button type="button" class="eye" data-action="toggle-password" aria-label="Show password">
          <span class="eye-open">${icons.eye}</span>
          <span class="eye-closed" hidden>${icons.eyeOff}</span>
        </button>
      </span>
    </label>`;
}

// Call once on a parent element. Works for every password field inside it.
export function bindPasswordToggle(root) {
   root.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="toggle-password"]');
      if (!btn) return;

      const input = btn.parentElement.querySelector("input");
      const show = input.type === "password";

      input.type = show ? "text" : "password";
      btn.querySelector(".eye-open").hidden = show;
      btn.querySelector(".eye-closed").hidden = !show;
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
   });
}
