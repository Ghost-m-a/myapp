import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { toast } from "../components/toast.js";
import { openForm } from "../components/formModal.js";
import {
   getSpec,
   listRecords,
   createRecord,
   updateRecord,
   deleteRecord,
   money,
   date,
   cap,
   exportCsv,
} from "../services/biz.js";

const chip = (s) => `<span class="status s-${s}">${cap(s)}</span>`;
const statusCol = {
   label: "Status",
   val: (r) => cap(r.status),
   html: (r) => chip(r.status),
};
const created = { label: "Created", val: (r) => date(r.createdAt) };

const PAGES = {
   products: {
      kind: "product",
      title: "Products",
      create: "Create product",
      empty: [
         "No products yet",
         "A product is needed to organize access to your offering.",
      ],
      cols: [
         { label: "Name", val: (r) => r.name },
         { label: "Price", val: (r) => money(r.price) },
         {
            label: "Visibility",
            val: (r) => cap(r.visibility),
            html: (r) => chip(r.visibility),
         },
         { label: "Sales", val: (r) => r.sales },
         { label: "All-time revenue", val: (r) => money(r.revenue) },
      ],
   },
   payments: {
      kind: "payment",
      title: "Payments",
      create: "Accept a payment",
      immutable: true,
      tabs: ["succeeded", "pending", "failed"],
      empty: [
         "No payments yet",
         "Payments you accept, deposits and withdrawals show up here.",
      ],
      cols: [
         {
            label: "Amount",
            val: (r) => (r.type === "withdrawal" ? "-" : "") + money(r.amount),
         },
         { label: "Type", val: (r) => cap(r.type) },
         statusCol,
         { label: "Product", val: (r) => r.productName || "-" },
         { label: "Method", val: (r) => cap(r.method) },
         { label: "Email", val: (r) => r.email || "-" },
         created,
      ],
   },
   checkout: {
      kind: "checkout",
      title: "Checkout links",
      create: "Create checkout link",
      empty: [
         "No checkout links yet",
         "Create a checkout link to accept one-off payments from your customers.",
      ],
      cols: [
         { label: "Product", val: (r) => r.productName || "-" },
         { label: "Notes", val: (r) => r.notes || "-" },
         {
            label: "Visibility",
            val: (r) => cap(r.visibility),
            html: (r) => chip(r.visibility),
         },
         { label: "Stock", val: (r) => r.stock ?? "Unlimited" },
         created,
      ],
   },
   invoices: {
      kind: "invoice",
      title: "Invoices",
      create: "Create invoice",
      tabs: ["draft", "sent", "paid"],
      empty: ["No invoices yet", "Send an invoice to get paid by a customer."],
      cols: [
         { label: "Customer", val: (r) => r.email },
         { label: "Amount", val: (r) => money(r.amount) },
         { label: "Description", val: (r) => r.description || "-" },
         statusCol,
         created,
      ],
      actions: [
         {
            label: () => "Mark paid",
            show: (r) => r.status !== "paid",
            patch: () => ({ status: "paid" }),
         },
      ],
   },
   promos: {
      kind: "promo",
      title: "Promo codes",
      create: "Create promo code",
      empty: [
         "No promo codes yet",
         "Create a code to give customers a discount.",
      ],
      cols: [
         { label: "Code", val: (r) => r.code },
         { label: "Discount", val: (r) => `${r.percentOff}%` },
         { label: "Max uses", val: (r) => r.maxUses ?? "Unlimited" },
         {
            label: "Active",
            val: (r) => (r.active ? "Active" : "Off"),
            html: (r) => chip(r.active ? "active" : "off"),
         },
         created,
      ],
   },
   ads: {
      kind: "ad",
      title: "Ads",
      create: "New campaign",
      tabs: ["active", "paused"],
      empty: [
         "No campaigns to show",
         "Create an ad campaign to start promoting your business.",
      ],
      cols: [
         { label: "Title", val: (r) => r.title },
         { label: "Platform", val: (r) => cap(r.platform) },
         { label: "Objective", val: (r) => cap(r.objective) },
         {
            label: "Budget",
            val: (r) =>
               `${money(r.budget)}${r.budgetType === "daily" ? "/day" : " total"}`,
         },
         statusCol,
         { label: "Spent", val: () => money(0) },
      ],
      actions: [
         {
            label: (r) => (r.status === "active" ? "Pause" : "Activate"),
            patch: (r) => ({
               status: r.status === "active" ? "paused" : "active",
            }),
         },
      ],
   },
   team: {
      kind: "team",
      title: "Team",
      create: "Invite member",
      empty: ["No team members", "Invite people to help run your business."],
      cols: [
         { label: "Email", val: (r) => r.email },
         { label: "Role", val: (r) => cap(r.role) },
         statusCol,
         { label: "Added", val: (r) => date(r.createdAt) },
      ],
   },
   subaccounts: {
      kind: "subaccount",
      title: "Sub accounts",
      create: "Create sub account",
      empty: [
         "No sub accounts",
         "Sub accounts keep money for separate projects apart.",
      ],
      cols: [
         { label: "Name", val: (r) => r.name },
         { label: "Description", val: (r) => r.description || "-" },
         created,
      ],
   },
   support: {
      kind: "support",
      title: "Support",
      create: "New support request",
      tabs: ["open", "closed"],
      empty: [
         "No support requests yet",
         "Customer questions you log here are tracked until closed.",
      ],
      cols: [
         { label: "Customer", val: (r) => r.email },
         { label: "Subject", val: (r) => r.subject },
         statusCol,
         created,
      ],
      actions: [
         {
            label: (r) => (r.status === "open" ? "Close" : "Reopen"),
            patch: (r) => ({ status: r.status === "open" ? "closed" : "open" }),
         },
      ],
   },
};

export function renderRecords(el, { business, path }) {
   const cfg = PAGES[path];
   const bid = business.id;
   let alive = true,
      rows = [],
      spec = null,
      refs = {},
      tab = "all",
      q = "";

   el.innerHTML = `
    <div class="page wide rec">
      <div class="page-head"><h1>${cfg.title}</h1>
        <button class="btn btn-primary" data-act="create">${icons.plus} ${cfg.create}</button></div>
      ${cfg.tabs ? `<div class="stat-tabs" id="tabs"></div>` : ""}
      <div class="toolbar">
        <label class="chat-search narrow">${icons.search}<input id="q" placeholder="Search..." /></label>
        <button class="btn btn-outline btn-sm" data-act="export">${icons.download} Export</button>
      </div>
      <div class="table-wrap" id="table"></div>
      <p class="muted-s" id="count"></p>
    </div>`;

   const $ = (s) => el.querySelector(s);
   const visible = () => {
      const s = q.toLowerCase();
      return rows.filter(
         (r) =>
            (tab === "all" || r.status === tab) &&
            (!s || JSON.stringify(Object.values(r)).toLowerCase().includes(s)),
      );
   };

   function actionsHTML(r) {
      const custom = (cfg.actions || [])
         .map((a, i) => ({ a, i }))
         .filter(({ a }) => !a.show || a.show(r))
         .map(
            ({ a, i }) =>
               `<button class="btn btn-sm btn-outline" data-act="custom" data-i="${i}">${a.label(r)}</button>`,
         );
      return [
         ...custom,
         cfg.immutable
            ? ""
            : `<button class="icon-btn sm" data-act="edit" aria-label="Edit">${icons.edit}</button>`,
         `<button class="icon-btn sm" data-act="delete" aria-label="Delete">${icons.trash}</button>`,
      ].join("");
   }

   function paint() {
      if (cfg.tabs) {
         $("#tabs").innerHTML = ["all", ...cfg.tabs]
            .map(
               (t) =>
                  `<button class="${t === tab ? "on" : ""}" data-tab="${t}"><small>${cap(t)}</small><b>${t === "all" ? rows.length : rows.filter((r) => r.status === t).length}</b></button>`,
            )
            .join("");
      }
      const list = visible();
      $("#count").textContent =
         `${list.length} result${list.length === 1 ? "" : "s"}`;

      $("#table").innerHTML = list.length
         ? `<table><thead><tr>${cfg.cols.map((c) => `<th>${c.label}</th>`).join("")}<th></th></tr></thead>
         <tbody>${list
            .map(
               (r) =>
                  `<tr data-id="${r.id}">${cfg.cols.map((c) => `<td>${c.html ? c.html(r) : escapeHtml(c.val(r) ?? "")}</td>`).join("")}<td class="acts">${actionsHTML(r)}</td></tr>`,
            )
            .join("")}</tbody></table>`
         : `<div class="empty"><h3>${rows.length ? "Nothing matches" : cfg.empty[0]}</h3><p class="muted">${rows.length ? "Try another search or filter." : cfg.empty[1]}</p></div>`;
   }

   async function refresh() {
      rows = await listRecords(bid, cfg.kind);
      if (alive) paint();
   }

   function form(record) {
      openForm({
         title: record ? `Edit ${cfg.kind}` : cfg.create,
         fields: spec[cfg.kind].fields,
         values: record || {},
         refs,
         submitLabel: record ? "Save changes" : "Create",
         onSubmit: async (v) => {
            if (record) await updateRecord(bid, cfg.kind, record.id, v);
            else await createRecord(bid, cfg.kind, v);
            await refresh();
            toast(record ? "Saved" : "Created");
         },
      });
   }

   el.addEventListener("click", async (e) => {
      const t = e.target.closest("[data-tab]");
      if (t) {
         tab = t.dataset.tab;
         return paint();
      }

      const btn = e.target.closest("[data-act]");
      if (!btn || !spec) return;
      const rec = rows.find((r) => r.id === btn.closest("tr")?.dataset.id);

      try {
         if (btn.dataset.act === "create") form(null);
         if (btn.dataset.act === "edit") form(rec);
         if (btn.dataset.act === "export")
            exportCsv(`${path}.csv`, cfg.cols, visible());
         if (btn.dataset.act === "custom") {
            await updateRecord(
               bid,
               cfg.kind,
               rec.id,
               cfg.actions[btn.dataset.i].patch(rec),
            );
            await refresh();
         }
         if (btn.dataset.act === "delete" && confirm("Delete this?")) {
            await deleteRecord(bid, cfg.kind, rec.id);
            await refresh();
            toast("Deleted");
         }
      } catch (err) {
         toast(err.message);
      }
   });

   $("#q").addEventListener("input", (e) => {
      q = e.target.value;
      paint();
   });

   (async () => {
      try {
         spec = await getSpec();
         if (spec[cfg.kind].fields.some((f) => f.type === "ref")) {
            refs.product = (await listRecords(bid, "product")).map((p) => ({
               id: p.id,
               name: p.name,
            }));
         }
         await refresh();
      } catch (err) {
         if (alive)
            $("#table").innerHTML =
               `<p class="notif-empty">${escapeHtml(err.message)}</p>`;
      }
   })();

   return () => {
      alive = false;
   };
}
