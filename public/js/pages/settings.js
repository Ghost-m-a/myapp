import { api } from "../services/api.js";
import { getState, setState, setWorkspace } from "../store.js";
import { avatarHTML } from "../components/avatar.js";
import { toast } from "../components/toast.js";
import { escapeHtml, fileToAvatar } from "../utils.js";
import { LANGUAGES, applyLanguage } from "../theme.js";

export function renderSettings(el, ctx) {
   if (ctx.business) businessSettings(el, ctx);
   else accountSettings(el, ctx);
}

function message(form) {
   const box = form.querySelector(".error");
   return (text) => {
      box.textContent = text;
      box.hidden = !text;
   };
}

function accountSettings(el, { user }) {
   el.innerHTML = `
    <div class="page">
      <h1>Settings</h1>
      <p class="muted">Manage your personal account.</p>

      <form class="panel form" id="profileForm">
        <h3>Profile</h3>
        <label class="avatar-pick">
          ${avatarHTML(user, "avatar-xl")}
          <span>Change picture <small>Shown as a circle</small></span>
          <input type="file" name="avatarFile" accept="image/*" hidden />
        </label>
        <label class="field">Full name
          <input name="name" value="${escapeHtml(user.name)}" maxlength="60" required />
        </label>
        <label class="field">Username <input value="${escapeHtml(user.username)}" disabled /></label>
        <label class="field">Email <input value="${escapeHtml(user.email)}" disabled /></label>
        <label class="field">Account type
          <input value="${user.role === "advertiser" ? "Advertiser" : "Content creator"}" disabled />
        </label>
        <label class="field">Language
          <select name="language">
            ${Object.entries(LANGUAGES)
               .map(
                  ([c, n]) =>
                     `<option value="${c}" ${c === user.language ? "selected" : ""}>${n}</option>`,
               )
               .join("")}
          </select>
        </label>
        <p class="error" hidden></p>
        <button class="btn btn-primary" type="submit">Save changes</button>
      </form>

      <form class="panel form" id="passwordForm">
        <h3>Password</h3>
        <label class="field">Current password
          <input type="password" name="current" autocomplete="current-password" required />
        </label>
        <label class="field">New password
          <input type="password" name="next" minlength="6" autocomplete="new-password" required />
        </label>
        <label class="field">Confirm new password
          <input type="password" name="confirm" autocomplete="new-password" required />
        </label>
        <p class="error" hidden></p>
        <button class="btn btn-primary" type="submit">Update password</button>
      </form>
    </div>`;

   const profile = el.querySelector("#profileForm");
   const profileMsg = message(profile);
   const preview = profile.querySelector(".avatar");
   let avatar; // stays undefined unless a new picture is chosen

   profile.elements.avatarFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
         avatar = await fileToAvatar(file);
         preview.style.backgroundImage = `url(${avatar})`;
         preview.textContent = "";
      } catch {
         profileMsg("Could not read that image.");
      }
   });

   profile.addEventListener("submit", async (e) => {
      e.preventDefault();
      profileMsg("");
      try {
         const body = {
            name: profile.elements.name.value,
            language: profile.elements.language.value,
         };
         if (avatar) body.avatar = avatar;
         const { user: updated } = await api("/auth/me", {
            method: "PATCH",
            body,
         });
         applyLanguage(updated.language);
         setState({ user: updated });
         toast("Profile saved");
      } catch (err) {
         profileMsg(err.message);
      }
   });

   const pass = el.querySelector("#passwordForm");
   const passMsg = message(pass);

   pass.addEventListener("submit", async (e) => {
      e.preventDefault();
      passMsg("");
      const f = pass.elements;
      if (f.next.value !== f.confirm.value)
         return passMsg("New passwords do not match.");
      try {
         await api("/auth/password", {
            method: "POST",
            body: { current: f.current.value, next: f.next.value },
         });
         pass.reset();
         toast("Password updated");
      } catch (err) {
         passMsg(err.message);
      }
   });
}

function businessSettings(el, { business }) {
   el.innerHTML = `
    <div class="page">
      <h1>Settings</h1>
      <p class="muted">Manage <b>${escapeHtml(business.name)}</b>.</p>

      <form class="panel form" id="bizForm">
        <h3>Business details</h3>
        <label class="field">Business name
          <input name="name" value="${escapeHtml(business.name)}" maxlength="40" required />
        </label>
        <label class="field">Description
          <textarea name="description" rows="3" maxlength="200">${escapeHtml(business.description)}</textarea>
        </label>
        <p class="error" hidden></p>
        <button class="btn btn-primary" type="submit">Save changes</button>
      </form>

      <section class="panel danger-zone">
        <h3>Delete business</h3>
        <p class="muted">This permanently removes the business and its workspace.</p>
        <button class="btn btn-danger" id="deleteBiz">Delete this business</button>
      </section>
    </div>`;

   const form = el.querySelector("#bizForm");
   const msg = message(form);

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg("");
      try {
         const { business: updated } = await api(`/businesses/${business.id}`, {
            method: "PATCH",
            body: {
               name: form.elements.name.value,
               description: form.elements.description.value,
            },
         });
         setState({
            businesses: getState().businesses.map((b) =>
               b.id === updated.id ? updated : b,
            ),
         });
         toast("Business saved");
      } catch (err) {
         msg(err.message);
      }
   });

   el.querySelector("#deleteBiz").addEventListener("click", async () => {
      if (!confirm(`Delete "${business.name}"? This cannot be undone.`)) return;
      try {
         await api(`/businesses/${business.id}`, { method: "DELETE" });
         setState({
            businesses: getState().businesses.filter(
               (b) => b.id !== business.id,
            ),
         });
         setWorkspace("personal");
         location.hash = "#/home";
         toast("Business deleted");
      } catch (err) {
         msg(err.message);
      }
   });
}
