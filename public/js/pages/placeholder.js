import { icons } from "../icons.js";
import { titleFor } from "../nav.js";

export function renderPlaceholder(el, { path }) {
   const title = titleFor(path);

   el.innerHTML = title
      ? `<div class="page">
         <h1>${title}</h1>
         <div class="empty">
           <span class="empty-icon">${icons.sparkle}</span>
           <h3>Nothing here yet</h3>
           <p class="muted">The ${title} page is ready for its content.</p>
         </div>
       </div>`
      : `<div class="page">
         <h1>Page not found</h1>
         <a href="#/home" class="btn btn-primary">Back to Home</a>
       </div>`;
}
