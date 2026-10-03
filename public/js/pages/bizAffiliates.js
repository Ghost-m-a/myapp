import { api } from "../services/api.js";
import { getState, setState } from "../store.js";
import { toast } from "../components/toast.js";
import { escapeHtml } from "../utils.js";

export function renderBizAffiliates(el, { business }) {
   el.innerHTML = `
    <div class="page wide">
      <h1>Affiliates</h1>
      <section class="panel form">
        <h3>Default affiliate commission</h3>
        <p class="muted">All your products pay <b>${business.affiliateCommission ?? 30}%</b> to affiliates by default.</p>
        <p class="error" hidden></p>
        <label class="field">Commission (%)
          <input id="pct" type="number" min="0" max="90" step="1" value="${business.affiliateCommission ?? 30}" />
        </label>
        <button class="btn btn-primary" id="save">Save commission</button>
      </section>
      <section class="panel">
        <h3>Leaderboard</h3>
        <div class="empty plain"><h3>No affiliates yet</h3>
          <p class="muted">Affiliates promoting ${escapeHtml(business.name)} will be ranked here.</p></div>
      </section>
    </div>`;

   el.querySelector("#save").addEventListener("click", async () => {
      const box = el.querySelector(".error");
      box.hidden = true;
      try {
         const { business: updated } = await api(`/businesses/${business.id}`, {
            method: "PATCH",
            body: { affiliateCommission: el.querySelector("#pct").value },
         });
         setState({
            businesses: getState().businesses.map((b) =>
               b.id === updated.id ? updated : b,
            ),
         });
         toast("Commission saved");
      } catch (err) {
         box.textContent = err.message;
         box.hidden = false;
      }
   });
}
