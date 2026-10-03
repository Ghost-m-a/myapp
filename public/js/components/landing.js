import { bus } from "../events.js";
import { subscribe } from "../store.js";

export function mountLanding(el) {
   el.className = "landing";
   el.innerHTML = `
    <h1>Build something great.</h1>
    <p>Log in or create an account to get started.</p>
    <button class="btn btn-primary btn-lg" data-action="get-started">Get started</button>`;

   el.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="get-started"]'))
         bus.emit("auth:open", "signup");
   });

   subscribe(({ user }) => {
      el.hidden = Boolean(user);
   });
}
