import { api } from "../services/api.js";
import { icons } from "../icons.js";
import { escapeHtml, timeAgo } from "../utils.js";
import { avatarHTML } from "../components/avatar.js";
import { toast } from "../components/toast.js";
import { setUnread } from "../badges.js";

const clock = (d) =>
   new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function renderMessages(el, { user, query }) {
   let convs = [];
   let msgs = [];
   let active = query.get("c");
   let filter = "all";
   let search = "";
   let alive = true;

   el.innerHTML = `
    <div class="chat ${active ? "chat-open" : ""}">
      <aside class="chat-list">
        <div class="chat-tools">
          <label class="chat-search">${icons.search}<input id="chatSearch" placeholder="Search..." /></label>
          <button class="icon-btn" id="newChat" aria-label="New message">${icons.edit}</button>
        </div>
        <div class="chat-picker" id="picker" hidden>
          <input id="pickInput" placeholder="Find people by name or username..." autocomplete="off" />
          <div id="pickResults"></div>
        </div>
        <div class="chat-filters">
          <button class="chip" data-f="unread"><i class="unread-dot"></i> Unread <span id="unreadCount"></span></button>
          <button class="chip" data-f="requests">Requests</button>
        </div>
        <div class="conv-list" id="convList"></div>
      </aside>
      <section class="chat-pane" id="pane"></section>
    </div>`;

   const $ = (s) => el.querySelector(s);
   const chat = $(".chat");
   const current = () => convs.find((c) => c.id === active);
   const totalUnread = () =>
      convs.filter((c) => !c.request).reduce((n, c) => n + c.unread, 0);

   function paintList() {
      const q = search.toLowerCase();
      const rows = convs.filter((c) => {
         if (filter === "requests") return c.request;
         if (c.request) return false;
         if (filter === "unread" && !c.unread) return false;
         return !q || c.other.name.toLowerCase().includes(q);
      });

      $("#convList").innerHTML =
         rows
            .map(
               (c) => `
      <button class="conv ${c.id === active ? "on" : ""} ${c.unread ? "unread" : ""}" data-id="${c.id}">
        ${avatarHTML(c.other, "avatar-lg")}
        <span class="conv-body">
          <span class="conv-top">
            <b>${escapeHtml(c.other.name)}${c.other.isSystem ? `<span class="verified">${icons.check}</span>` : ""}</b>
            <small>${timeAgo(c.lastAt)}</small>
          </span>
          <span class="conv-last">${escapeHtml(c.lastMessage || "No messages yet")}</span>
        </span>
        ${c.unread ? `<i class="unread-dot"></i>` : ""}
      </button>`,
            )
            .join("") ||
         `<p class="notif-empty">${filter === "requests" ? "No message requests." : "No conversations yet."}</p>`;

      const n = totalUnread();
      $("#unreadCount").textContent = n || "";
      el.querySelectorAll(".chip").forEach((b) =>
         b.classList.toggle("on", b.dataset.f === filter),
      );
   }

   function paintPane() {
      const pane = $("#pane");
      const c = current();
      if (!c) {
         pane.innerHTML = `
        <div class="pane-empty">
          <span class="empty-icon">${icons.messages}</span>
          <h3>Select a conversation</h3>
          <p>Choose a chat from the list, or start a new one.</p>
        </div>`;
         return;
      }
      pane.innerHTML = `
      <header class="pane-head">
        <button class="icon-btn back" data-back aria-label="Back">${icons.back}</button>
        ${avatarHTML(c.other)}
        <div><strong>${escapeHtml(c.other.name)}</strong><small>@${escapeHtml(c.other.username)}</small></div>
      </header>
      <div class="thread" id="thread"></div>
      ${
         c.other.isSystem
            ? `<p class="pane-note">This is an official account. You can't reply.</p>`
            : `<form class="composer" id="composer">
               <input name="text" placeholder="Write a message..." maxlength="2000" autocomplete="off" required />
               <button class="btn btn-primary" aria-label="Send">${icons.send}</button>
             </form>`
      }`;
      paintThread(true);
   }

   function paintThread(forceScroll) {
      const t = $("#thread");
      if (!t) return;
      const nearBottom = t.scrollHeight - t.scrollTop - t.clientHeight < 80;
      t.innerHTML =
         msgs
            .map(
               (m) => `
        <div class="msg ${m.sender === user.id ? "mine" : ""}">
          ${escapeHtml(m.text)}<small>${clock(m.createdAt)}</small>
        </div>`,
            )
            .join("") ||
         `<p class="notif-empty">No messages yet. Say hello!</p>`;
      if (forceScroll || nearBottom) t.scrollTop = t.scrollHeight;
   }

   async function loadList() {
      const { conversations } = await api("/messages/conversations");
      if (!alive) return;
      convs = conversations;
      const a = current();
      if (a) a.unread = 0; // the open thread marks itself read
      setUnread(totalUnread());
      paintList();
   }

   async function loadThread(forceScroll) {
      const id = active;
      if (!id) return;
      const { messages } = await api(`/messages/conversations/${id}`);
      if (!alive || id !== active) return;
      const changed =
         messages.length !== msgs.length ||
         messages.at(-1)?.id !== msgs.at(-1)?.id;
      msgs = messages;
      if (changed || forceScroll) paintThread(forceScroll);
   }

   async function open(id) {
      active = id;
      chat.classList.add("chat-open");
      history.replaceState(null, "", `#/messages?c=${id}`);
      msgs = [];
      const c = current();
      if (c) c.unread = 0;
      paintPane();
      paintList();
      setUnread(totalUnread());
      await loadThread(true).catch(() => {});
   }

   // ---- events ----
   $("#convList").addEventListener("click", (e) => {
      const row = e.target.closest("[data-id]");
      if (row) open(row.dataset.id);
   });

   el.querySelector(".chat-filters").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-f]");
      if (!chip) return;
      filter = filter === chip.dataset.f ? "all" : chip.dataset.f;
      paintList();
   });

   $("#chatSearch").addEventListener("input", (e) => {
      search = e.target.value;
      paintList();
   });

   $("#newChat").addEventListener("click", () => {
      const p = $("#picker");
      p.hidden = !p.hidden;
      if (!p.hidden) $("#pickInput").focus();
   });

   let pickTimer;
   $("#pickInput").addEventListener("input", (e) => {
      clearTimeout(pickTimer);
      pickTimer = setTimeout(async () => {
         try {
            const { users } = await api(
               `/discover/users?q=${encodeURIComponent(e.target.value)}`,
            );
            $("#pickResults").innerHTML = users
               .map(
                  (
                     u,
                  ) => `<button class="conv" data-uid="${u.id}">${avatarHTML(u)}
              <span class="conv-body"><b>${escapeHtml(u.name)}</b><span class="conv-last">@${escapeHtml(u.username)}</span></span></button>`,
               )
               .join("");
         } catch {}
      }, 250);
   });

   $("#pickResults").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-uid]");
      if (!btn) return;
      try {
         const { conversation } = await api("/messages/conversations", {
            method: "POST",
            body: { userId: btn.dataset.uid },
         });
         if (!convs.some((c) => c.id === conversation.id))
            convs.unshift(conversation);
         $("#picker").hidden = true;
         $("#pickInput").value = "";
         $("#pickResults").innerHTML = "";
         open(conversation.id);
      } catch (err) {
         toast(err.message);
      }
   });

   $("#pane").addEventListener("click", (e) => {
      if (!e.target.closest("[data-back]")) return;
      active = null;
      chat.classList.remove("chat-open");
      history.replaceState(null, "", "#/messages");
      paintPane();
      paintList();
   });

   $("#pane").addEventListener("submit", async (e) => {
      if (!e.target.matches("#composer")) return;
      e.preventDefault();
      const input = e.target.elements.text;
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      try {
         const { message } = await api(`/messages/conversations/${active}`, {
            method: "POST",
            body: { text },
         });
         msgs.push(message);
         paintThread(true);
         loadList().catch(() => {});
      } catch (err) {
         input.value = text;
         toast(err.message);
      }
   });

   // ---- start + polling ----
   paintPane();
   loadList()
      .then(() => {
         if (active && current()) open(active);
         else active = null;
      })
      .catch(() => {});

   const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
         await loadThread(false);
         await loadList();
      } catch {}
   }, 5000);

   return () => {
      alive = false;
      clearInterval(timer);
      clearTimeout(pickTimer);
   };
}
