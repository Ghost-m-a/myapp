import { icons } from "../icons.js";
import { bus } from "../events.js";
import { api } from "../services/api.js";
import { refreshNotifications } from "../services/session.js";
import { getState, setState, setWorkspace } from "../store.js";
import { toast } from "./toast.js";

export function mountBusinessModal() {
   const el = document.createElement("div");
   el.className = "modal";
   el.hidden = true;
   el.innerHTML = `
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Start a business">
      <button class="icon-btn modal-close" data-action="close" aria-label="Close">${icons.close}</button>
      <h2>Start a business</h2>
      <p class="muted">A business gets its own workspace for products, customers and payments.</p>
      <p class="error" role="alert" hidden></p>
      <form class="form">
        <label class="field">Business name
          <input name="name" maxlength="40" required placeholder="Spark &amp; Learn" />
        </label>
        <label class="field">Description <small>(optional)</small>
          <textarea name="description" maxlength="200" rows="3"></textarea>
        </label>
        <button class="btn btn-primary btn-block" type="submit">Create business</button>
      </form>
    </div>`;
   document.body.append(el);

   const form = el.querySelector("form");
   const errorEl = el.querySelector(".error");
   const submitBtn = form.querySelector('[type="submit"]');

   const showError = (msg) => {
      errorEl.textContent = msg;
      errorEl.hidden = !msg;
   };

   function open() {
      showError("");
      el.hidden = false;
      document.body.classList.add("modal-open");
      form.elements.name.focus();
   }

   function close() {
      el.hidden = true;
      document.body.classList.remove("modal-open");
      form.reset();
   }

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      try {
         const { business } = await api("/businesses", {
            method: "POST",
            body: {
               name: form.elements.name.value,
               description: form.elements.description.value,
            },
         });
         setState({ businesses: [...getState().businesses, business] });
         setWorkspace(business.id);
         location.hash = "#/home";
         close();
         toast(`${business.name} created`);
         refreshNotifications().catch(() => {});
      } catch (err) {
         showError(err.message);
      } finally {
         submitBtn.disabled = false;
      }
   });

   el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest('[data-action="close"]')) close();
   });
   document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.hidden) close();
   });

   bus.on("business:new", open);
}
