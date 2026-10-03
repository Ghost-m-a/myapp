export function renderBilling(el, { user }) {
   el.innerHTML = `
    <div class="page">
      <h1>Billing</h1>
      <p class="muted">Your credit balance.</p>
      <section class="panel">
        <h3>Credits</h3>
        <p class="big-number">${user.credits}</p>
        <p class="muted">Buying more credits arrives with the payments step.</p>
      </section>
    </div>`;
}
