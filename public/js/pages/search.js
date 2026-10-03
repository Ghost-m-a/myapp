import { getNav, flatItems } from "../nav.js";
import { setWorkspace } from "../store.js";
import { escapeHtml } from "../utils.js";

export function renderSearch(el, { query, business, businesses, user }) {
   const q = (query.get("q") || "").trim().toLowerCase();
   const pages = q
      ? flatItems(getNav({ business, role: user.role })).filter((i) =>
           i.name.toLowerCase().includes(q),
        )
      : [];
   const biz = q
      ? businesses.filter((b) => b.name.toLowerCase().includes(q))
      : [];

   el.innerHTML = `
    <div class="page">
      <h1>Search</h1>
      <p class="muted">${q ? `Results for “${escapeHtml(q)}”` : "Type something in the search bar."}</p>

      ${
         pages.length
            ? `<section class="panel"><h3>Pages</h3><ul class="result-list">
        ${pages.map((p) => `<li><a href="#/${p.path}">${p.name}</a></li>`).join("")}</ul></section>`
            : ""
      }

      ${
         biz.length
            ? `<section class="panel"><h3>Businesses</h3><ul class="result-list">
        ${biz.map((b) => `<li><button data-ws="${b.id}">${escapeHtml(b.name)}</button></li>`).join("")}</ul></section>`
            : ""
      }

      ${q && !pages.length && !biz.length ? `<p class="muted">Nothing found.</p>` : ""}
    </div>`;

   el.querySelectorAll("[data-ws]").forEach((btn) =>
      btn.addEventListener("click", () => {
         setWorkspace(btn.dataset.ws);
         location.hash = "#/home";
      }),
   );
}
