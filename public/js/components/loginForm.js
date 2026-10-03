import { authHeader } from "./authHeader.js";
import { inputField } from "./field.js";
import { passwordField } from "./passwordField.js";
import { socialButtons } from "./socialButtons.js";
import { login } from "../services/authService.js";

export function loginForm() {
   return `
    <section class="auth-face front" data-face="login">
      ${authHeader("Welcome back", "Enter your credentials to access your workspace")}
      <p class="error" data-role="error" role="alert" hidden></p>

      <form id="loginForm" class="auth-form">
        ${inputField({
           label: "Email or Username",
           icon: "mail",
           name: "identifier",
           placeholder: "name@company.com",
           autocomplete: "username",
        })}
        ${passwordField({ placeholder: "Your password" })}

        <div class="auth-row">
          <label class="check"><input type="checkbox" name="remember" checked /> Remember me</label>
          <button type="button" class="link-btn underline" data-action="forgot">Forgot Password?</button>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Log In</button>
      </form>

      ${socialButtons(["Google", "Apple"], "or continue with")}

      <p class="switch-text">Don't have an account?
        <button type="button" class="link-btn" data-action="flip" data-tab="signup">Sign up</button>
      </p>
    </section>`;
}

export function bindLoginForm(form, { onError, onSuccess }) {
   const submitBtn = form.querySelector('[type="submit"]');

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      submitBtn.disabled = true;

      try {
         const user = await login({
            identifier: data.get("identifier"),
            password: data.get("password"),
            remember: form.elements.remember.checked,
         });
         await onSuccess(user);
      } catch (err) {
         onError(err.message);
      } finally {
         submitBtn.disabled = false;
      }
   });
}
