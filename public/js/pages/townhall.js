import { api } from "../services/api.js";
import { icons } from "../icons.js";
import { escapeHtml, timeAgo, copyText } from "../utils.js";
import { avatarHTML } from "../components/avatar.js";
import { toast } from "../components/toast.js";

const linkify = (text) =>
   escapeHtml(text).replace(
      /https?:\/\/[^\s<]+/g,
      (u) =>
         `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`,
   );

const LABELS = { all: "All", following: "Following", mine: "Mine" };

export function renderTownhall(el, { user, businesses }) {
   let filter = "all";
   let alive = true;

   el.innerHTML = `
    <div class="town">
      <section class="feed">
        <header class="feed-head">
          <h1>Townhall <i class="live-dot"></i></h1>
          <div class="seg" id="seg">
            ${Object.entries(LABELS)
               .map(
                  ([f, n]) =>
                     `<button data-f="${f}" class="${f === filter ? "on" : ""}">${n}</button>`,
               )
               .join("")}
          </div>
        </header>

        <form class="composer-box" id="postForm">
          <select name="businessId" aria-label="Post as">
            <option value="">Posting as ${escapeHtml(user.name)}</option>
            ${businesses.map((b) => `<option value="${b.id}">Posting as ${escapeHtml(b.name)}</option>`).join("")}
          </select>
          <div class="cb-row">
            ${avatarHTML(user)}
            <textarea name="body" rows="2" maxlength="1000" placeholder="Say something they'll screenshot..." required></textarea>
          </div>
          <div class="cb-bounty" id="bountyRow" hidden>
            <input name="title" maxlength="100" placeholder="Title" />
            <input name="bounty" type="number" min="0" step="0.01" placeholder="Reward in $" />
          </div>
          <div class="cb-actions">
            <button type="button" class="icon-btn" id="bountyBtn" aria-label="Add a reward" title="Add a reward">${icons.coin}</button>
            <button class="btn btn-primary" type="submit">Post</button>
          </div>
        </form>

        <div id="posts"></div>
      </section>

      <aside class="popular panel">
        <h3>Popular users</h3>
        <div id="people"></div>
      </aside>
    </div>`;

   const $ = (s) => el.querySelector(s);
   const postsEl = $("#posts");

   const postHTML = (p) => `
    <article class="post" data-id="${p.id}">
      <div class="post-meta">${p.business ? `${escapeHtml(p.business.name)} · ` : ""}${p.forum}</div>
      <div class="post-row">
        ${avatarHTML(p.author)}
        <div class="post-main">
          <div class="post-head">
            <b>${escapeHtml(p.author.name)}</b>
            <span class="muted-s">@${escapeHtml(p.author.username)} · ${timeAgo(p.createdAt)}</span>
            ${p.author.id === user.id ? `<button class="icon-btn sm" data-act="delete" aria-label="Delete post">${icons.trash}</button>` : ""}
          </div>
          ${
             p.bounty
                ? `<div class="bounty">
                   <strong class="bounty-price">$${p.bounty}</strong>
                   ${p.title ? `<h4>${escapeHtml(p.title)}</h4>` : ""}
                   <p class="post-body">${linkify(p.body)}</p>
                 </div>`
                : `<p class="post-body">${linkify(p.body)}</p>`
          }
          <div class="post-actions">
            <button data-act="comments">${icons.messages}<span class="cc">${p.comments}</span></button>
            <button data-act="like" class="${p.liked ? "liked" : ""}">${icons.heart}<span class="lc">${p.likes}</span></button>
            <span>${icons.bars}${p.views}</span>
            <button data-act="share" aria-label="Copy link">${icons.share}</button>
          </div>
          <div class="comments" hidden>
            <div class="clist"></div>
            <form class="cform">
              <input name="text" placeholder="Write a comment..." maxlength="500" required autocomplete="off" />
              <button class="btn btn-primary">Reply</button>
            </form>
          </div>
        </div>
      </div>
    </article>`;

   async function loadPosts() {
      postsEl.innerHTML = `<p class="notif-empty">Loading...</p>`;
      try {
         const { posts } = await api(`/townhall/posts?filter=${filter}`);
         if (!alive) return;
         postsEl.innerHTML =
            posts.map(postHTML).join("") ||
            `<div class="empty"><h3>No posts here yet</h3><p class="muted">${filter === "following" ? "Follow people to see their posts." : "Be the first to post."}</p></div>`;
      } catch (err) {
         postsEl.innerHTML = `<p class="notif-empty">${escapeHtml(err.message)}</p>`;
      }
   }

   const personHTML = (u) => `
    <div class="person">
      ${avatarHTML(u, "avatar-lg")}
      <div class="person-text">
        <b>${escapeHtml(u.name)}</b>
        <small>${u.role === "advertiser" ? "Advertiser" : "Creator"} · ${u.followers} follower${u.followers === 1 ? "" : "s"}</small>
      </div>
      <button class="btn btn-sm ${u.following ? "btn-outline" : "btn-primary"}" data-follow="${u.id}">${u.following ? "Following" : "Follow"}</button>
    </div>`;

   async function loadPeople() {
      try {
         const { users } = await api("/townhall/users");
         if (!alive) return;
         $("#people").innerHTML =
            users.map(personHTML).join("") ||
            `<p class="notif-empty">No other users yet.</p>`;
      } catch {}
   }

   // ---- events ----
   $("#seg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]");
      if (!b) return;
      filter = b.dataset.f;
      el.querySelectorAll("#seg button").forEach((x) =>
         x.classList.toggle("on", x === b),
      );
      loadPosts();
   });

   $("#bountyBtn").addEventListener("click", () => {
      $("#bountyRow").hidden = !$("#bountyRow").hidden;
   });

   $("#postForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const btn = e.target.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
         const { post } = await api("/townhall/posts", {
            method: "POST",
            body: {
               body: f.body.value,
               businessId: f.businessId.value || undefined,
               title: f.title.value,
               bounty: f.bounty.value,
            },
         });
         e.target.reset();
         $("#bountyRow").hidden = true;
         if (filter === "following") return toast("Posted");
         postsEl.querySelector(".empty")?.remove();
         postsEl.insertAdjacentHTML("afterbegin", postHTML(post));
      } catch (err) {
         toast(err.message);
      } finally {
         btn.disabled = false;
      }
   });

   postsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const article = btn.closest("article");
      const id = article.dataset.id;

      try {
         if (btn.dataset.act === "like") {
            const r = await api(`/townhall/posts/${id}/like`, {
               method: "POST",
            });
            btn.classList.toggle("liked", r.liked);
            btn.querySelector(".lc").textContent = r.likes;
         }

         if (btn.dataset.act === "share") {
            toast(
               (await copyText(`${location.origin}/#/townhall`))
                  ? "Link copied"
                  : "Could not copy",
            );
         }

         if (btn.dataset.act === "delete") {
            if (!confirm("Delete this post?")) return;
            await api(`/townhall/posts/${id}`, { method: "DELETE" });
            article.remove();
         }

         if (btn.dataset.act === "comments") {
            const box = article.querySelector(".comments");
            box.hidden = !box.hidden;
            if (!box.hidden && !box.dataset.loaded) {
               const { comments } = await api(`/townhall/posts/${id}/comments`);
               box.querySelector(".clist").innerHTML = comments
                  .map(commentHTML)
                  .join("");
               box.dataset.loaded = "1";
               box.querySelector("input").focus();
            }
         }
      } catch (err) {
         toast(err.message);
      }
   });

   const commentHTML = (c) =>
      `<p class="comment"><b>${escapeHtml(c.author.name)}</b> ${escapeHtml(c.text)} <small>${timeAgo(c.createdAt)}</small></p>`;

   postsEl.addEventListener("submit", async (e) => {
      if (!e.target.matches(".cform")) return;
      e.preventDefault();
      const article = e.target.closest("article");
      const input = e.target.elements.text;
      try {
         const { comment } = await api(
            `/townhall/posts/${article.dataset.id}/comments`,
            {
               method: "POST",
               body: { text: input.value },
            },
         );
         article
            .querySelector(".clist")
            .insertAdjacentHTML("beforeend", commentHTML(comment));
         const cc = article.querySelector(".cc");
         cc.textContent = Number(cc.textContent) + 1;
         input.value = "";
      } catch (err) {
         toast(err.message);
      }
   });

   $("#people").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-follow]");
      if (!btn) return;
      try {
         const { following } = await api(
            `/townhall/follow/${btn.dataset.follow}`,
            { method: "POST" },
         );
         btn.textContent = following ? "Following" : "Follow";
         btn.classList.toggle("btn-primary", !following);
         btn.classList.toggle("btn-outline", following);
      } catch (err) {
         toast(err.message);
      }
   });

   loadPosts();
   loadPeople();
   return () => {
      alive = false;
   };
}
