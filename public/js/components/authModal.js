import { icons } from "../icons.js";
import { bus } from "../events.js";
import { startSession } from "../services/session.js";
import { loginForm, bindLoginForm } from "./loginForm.js";
import { signupForm, bindSignupForm } from "./signupForm.js";
import { bindPasswordToggle } from "./passwordField.js";

export function mountAuthModal(el) {
   el.className = "modal";
   el.hidden = true;

   el.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true" aria-label="Log in or sign up">
      <button class="icon-btn modal-close" data-action="close" aria-label="Close">${icons.close}</button>
      ${loginForm()}
      ${signupForm()}
    </div>`;

   const card = el.querySelector(".auth-card");
   const loginFace = el.querySelector('[data-face="login"]');
   const signupFace = el.querySelector('[data-face="signup"]');
   const login = el.querySelector("#loginForm");
   const signup = el.querySelector("#signupForm");

   // There is one error box on each side of the card
   function showError(message) {
      el.querySelectorAll('[data-role="error"]').forEach((box) => {
         box.textContent = message;
         box.hidden = !message;
      });
   }

   // Flips the card. `inert` makes the hidden side unclickable and unfocusable.
   function showTab(tab, focus = true) {
      const isLogin = tab === "login";
      card.classList.toggle("flipped", !isLogin);
      loginFace.inert = !isLogin;
      signupFace.inert = isLogin;
      showError("");

      if (focus) {
         const face = isLogin ? loginFace : signupFace;
         const first = face.querySelector(
            "input:not([type=file]):not([type=checkbox])",
         );
         setTimeout(() => first.focus(), 350); // wait for the flip
      }
   }

   function open(tab = "login") {
      showTab(tab);
      el.hidden = false;
      document.body.classList.add("modal-open");
   }

   function close() {
      el.hidden = true;
      document.body.classList.remove("modal-open");
      showError("");
      login.reset();
      resetSignup();
   }

   async function onSuccess(user) {
      await startSession(user); // loads businesses + notifications
      location.hash = "#/home";
      close();
   }

   bindLoginForm(login, { onError: showError, onSuccess });
   const resetSignup = bindSignupForm(signup, {
      onError: showError,
      onSuccess,
   });
   bindPasswordToggle(el);

   el.addEventListener("click", (e) => {
      if (e.target === el) return close(); // click outside the card

      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
         case "close":
            close();
            break;
         case "flip":
            showTab(target.dataset.tab);
            break;
         case "forgot":
            showError("Password reset isn't available yet.");
            break;
         case "social":
            showError(`${target.dataset.provider} login isn't available yet.`);
            break;
      }
   });

   document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.hidden) close();
   });

   bus.on("auth:open", open);
}
