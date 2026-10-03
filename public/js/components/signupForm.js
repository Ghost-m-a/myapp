import { authHeader } from "./authHeader.js";
import { inputField } from "./field.js";
import { passwordField } from "./passwordField.js";
import { socialButtons } from "./socialButtons.js";
import { icons } from "../icons.js";
import { signup } from "../services/authService.js";
import { fileToAvatar } from "../utils.js";

export function signupForm() {
   return `
    <section class="auth-face back" data-face="signup">
      ${authHeader("Create Account", "Get started with your secure cloud workspace today")}
      <p class="error" data-role="error" role="alert" hidden></p>

      <form id="signupForm" class="auth-form">
        <label class="avatar-upload">
          <span class="avatar avatar-lg" data-role="avatar-preview">+</span>
          <span>Add a profile picture <small>(optional)</small></span>
          <input type="file" name="avatarFile" accept="image/*" hidden />
        </label>

        ${inputField({ label: "Full Name", icon: "user", name: "name", placeholder: "John Doe", autocomplete: "name" })}
        ${inputField({ label: "Email", icon: "mail", name: "email", type: "email", placeholder: "name@company.com", autocomplete: "email" })}
        ${passwordField({ placeholder: "At least 6 characters", minlength: 6, autocomplete: "new-password" })}
        ${passwordField({ label: "Confirm Password", name: "confirm", placeholder: "Repeat your password", autocomplete: "new-password" })}

        <label class="field-label">Role
          <span class="input-wrap has-action">
            <span class="input-icon">${icons.briefcase}</span>
            <select name="role" required>
              <option value="" disabled selected>Select your role</option>
              <option value="advertiser">Advertiser</option>
              <option value="creator">Content creator</option>
            </select>
            <span class="input-icon right">${icons.chevronDown}</span>
          </span>
        </label>

        <label class="check">
          <input type="checkbox" name="terms" required />
          <span>I agree to the <a href="#" class="underline">Terms and Conditions</a></span>
        </label>

        <button type="submit" class="btn btn-primary btn-block">Sign Up</button>
      </form>

      ${socialButtons(["Google", "Apple", "Facebook"], "or sign up with")}

      <p class="switch-text">Already have an account?
        <button type="button" class="link-btn" data-action="flip" data-tab="login">Log in</button>
      </p>
    </section>`;
}

// Returns a reset() function so the modal can clear the form when it closes
export function bindSignupForm(form, { onError, onSuccess }) {
   const fileInput = form.elements.avatarFile;
   const preview = form.querySelector('[data-role="avatar-preview"]');
   const submitBtn = form.querySelector('[type="submit"]');
   let avatar = null;

   fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
         avatar = await fileToAvatar(file);
         preview.style.backgroundImage = `url(${avatar})`;
         preview.textContent = "";
      } catch {
         onError("Could not read that image. Try another one.");
      }
   });

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);

      if (data.get("password") !== data.get("confirm")) {
         return onError("Passwords do not match.");
      }

      submitBtn.disabled = true;
      try {
         const user = await signup({
            name: data.get("name"),
            email: data.get("email"),
            password: data.get("password"),
            role: data.get("role"),
            avatar,
            ref: localStorage.getItem("ref") || undefined, // referral link code
         });
         localStorage.removeItem("ref");
         await onSuccess(user);
      } catch (err) {
         onError(err.message);
      } finally {
         submitBtn.disabled = false;
      }
   });

   return function reset() {
      form.reset();
      avatar = null;
      preview.style.backgroundImage = "";
      preview.textContent = "+";
   };
}
