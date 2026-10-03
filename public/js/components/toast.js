export function toast(message) {
   const el = document.createElement("div");
   el.className = "toast";
   el.textContent = message;
   document.body.append(el);
   setTimeout(() => el.remove(), 2600);
}
