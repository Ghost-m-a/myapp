import { icons } from "../icons.js";

// A labeled input with an icon on the left
export function inputField({
   label,
   icon,
   name,
   type = "text",
   placeholder = "",
   autocomplete = "",
   required = true,
}) {
   return `
    <label class="field-label">${label}
      <span class="input-wrap">
        <span class="input-icon">${icons[icon]}</span>
        <input type="${type}" name="${name}" placeholder="${placeholder}"
               ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
               ${required ? "required" : ""} />
      </span>
    </label>`;
}
