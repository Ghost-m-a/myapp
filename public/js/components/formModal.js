import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { cap } from "../services/biz.js";

export function openDialog(html) {
   const el = document.createElement("div");
   el.className = "modal";
   el.innerHTML = `<div class="dialog wide">
    <button class="icon-btn modal-close" data-close aria-label="Close">${icons.close}</button>${html}</div>`;
   document.body.append(el);
   document.body.classList.add("modal-open");

   const onKey = (e) => e.key === "Escape" && close();
   function close() {
      document.removeEventListener("keydown", onKey);
      el.remove();
      if (!document.querySelector(".modal:not([hidden])"))
         document.body.classList.remove("modal-open");
   }
   document.addEventListener("keydown", onKey);
   el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest("[data-close]")) close();
   });
   return { el, box: el.firstElementChild, close };
}

function control(fld, value, refs) {
   const v = value ?? "";
   const req = fld.required ? "required" : "";
   const name = `name="${fld.name}"`;

   switch (fld.type) {
      case "text":
         return `<textarea ${name} rows="3" maxlength="${fld.max || 500}" ${req}>${escapeHtml(v)}</textarea>`;
      case "number":
         return `<input ${name} type="number" step="0.01" min="${fld.min ?? 0}" ${fld.max ? `max="${fld.max}"` : ""} value="${escapeHtml(v)}" ${req} />`;
      case "enum":
         return `<select ${name}>${fld.options
            .map(
               (o) =>
                  `<option value="${o}" ${(v || fld.default) === o ? "selected" : ""}>${cap(o)}</option>`,
            )
            .join("")}</select>`;
      case "ref": {
         const list = refs[fld.ref] || [];
         return `<select ${name} ${req}>
        ${fld.required ? `<option value="" disabled ${v ? "" : "selected"}>Choose...</option>` : `<option value="">None</option>`}
        ${list.map((o) => `<option value="${o.id}" ${o.id === v ? "selected" : ""}>${escapeHtml(o.name)}</option>`).join("")}
      </select>`;
      }
      case "bool":
         return `<input type="checkbox" ${name} ${v === true || (v === "" && fld.default) ? "checked" : ""} />`;
      case "multi":
         return `<span class="multi">${fld.options
            .map(
               (o) =>
                  `<label><input type="checkbox" name="${fld.name}" value="${o}" ${[].concat(v).includes(o) ? "checked" : ""} /> ${cap(o)}</label>`,
            )
            .join("")}</span>`;
      default:
         return `<input ${name} type="${fld.type === "email" ? "email" : "text"}" maxlength="${fld.max || 200}" value="${escapeHtml(v)}" ${req} />`;
   }
}

// fields use the same shape as server/utils/kinds.js
export function openForm({
   title,
   intro = "",
   fields,
   values = {},
   refs = {},
   submitLabel = "Save",
   onSubmit,
}) {
   const visible = fields.filter((f) => !f.hidden);
   const { box, close } = openDialog(`
    <h2>${escapeHtml(title)}</h2>
    ${intro ? `<p class="muted">${escapeHtml(intro)}</p>` : ""}
    <p class="error" role="alert" hidden></p>
    <form class="form">
      ${visible
         .map(
            (f) =>
               `<label class="field ${f.type === "bool" ? "inline" : ""}">${escapeHtml(f.label)}${control(f, values[f.name], refs)}</label>`,
         )
         .join("")}
      <button class="btn btn-primary btn-block" type="submit">${escapeHtml(submitLabel)}</button>
    </form>`);

   const form = box.querySelector("form");
   const errorEl = box.querySelector(".error");
   form.querySelector("input, select, textarea")?.focus();

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = {};
      for (const f of visible) {
         if (f.type === "bool") out[f.name] = form.elements[f.name].checked;
         else if (f.type === "multi")
            out[f.name] = [
               ...form.querySelectorAll(`input[name="${f.name}"]:checked`),
            ].map((i) => i.value);
         else out[f.name] = form.elements[f.name].value;
      }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      errorEl.hidden = true;
      try {
         await onSubmit(out);
         close();
      } catch (err) {
         errorEl.textContent = err.message;
         errorEl.hidden = false;
      } finally {
         btn.disabled = false;
      }
   });
}
