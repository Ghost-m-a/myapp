import { icons } from "../icons.js";

const providerIcons = {
   Google: icons.google,
   Apple: icons.apple,
   Facebook: icons.facebook,
};

export function socialButtons(
   providers = ["Google", "Apple"],
   label = "or continue with",
) {
   return `
    <div class="divider"><span>${label}</span></div>
    <div class="socials">
      ${providers
         .map(
            (name) => `
        <button type="button" class="btn btn-outline" data-action="social" data-provider="${name}">
          ${providerIcons[name]} Continue with ${name}
        </button>`,
         )
         .join("")}
    </div>`;
}
