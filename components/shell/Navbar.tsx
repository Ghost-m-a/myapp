"use client";

import {
   useEffect,
   useRef,
   useState,
   type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/client/store";
import { api } from "@/lib/client/api";
import { bus } from "@/lib/client/bus";
import { Icon } from "@/lib/client/icons";
import { Avatar } from "@/components/Avatar";
import { initials, timeAgo } from "@/lib/client/utils";
import {
   getTheme,
   toggleTheme,
   applyLanguage,
   LANGUAGES,
} from "@/lib/client/theme";

type Menu = "notifications" | "user" | null;

export function Navbar() {
   const {
      user,
      businesses,
      business,
      notifications,
      workspace,
      unread,
      ready,
      patch,
      setWorkspace,
      startSession,
   } = useSession();
   const router = useRouter();
   const [openMenu, setOpenMenu] = useState<Menu>(null);
   const rootRef = useRef<HTMLElement>(null);
   const searchRef = useRef<HTMLInputElement>(null);

   const unreadNotifs = notifications.filter((n) => !n.read).length;

   // Close dropdowns on outside click / Escape; Ctrl+K focuses search.
   useEffect(() => {
      const onClick = (e: MouseEvent) => {
         if (!(e.target as HTMLElement).closest(".dropdown")) setOpenMenu(null);
      };
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") setOpenMenu(null);
         if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            searchRef.current?.focus();
         }
      };
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
      return () => {
         document.removeEventListener("click", onClick);
         document.removeEventListener("keydown", onKey);
      };
   }, []);

   // Opening the bell marks everything as read
   function toggleMenu(menu: Exclude<Menu, null>) {
      const next = openMenu === menu ? null : menu;
      setOpenMenu(next);
      if (next === "notifications" && notifications.some((n) => !n.read)) {
         patch({
            notifications: notifications.map((n) => ({ ...n, read: true })),
         });
         api("/notifications/read-all", { method: "POST" }).catch(() => {});
      }
   }

   function switchWorkspace(id: string) {
      setWorkspace(id);
      setOpenMenu(null);
      router.push("/");
   }

   function onSearch(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const q = new FormData(e.currentTarget).get("q") as string;
      if (q?.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
   }

   async function onToggleTheme() {
      const next = toggleTheme();
      if (user) {
         patch({ user: { ...user, theme: next as "light" | "dark" } });
         api("/auth/me", { method: "PATCH", body: { theme: next } }).catch(
            () => {},
         );
      }
   }

   async function onLanguage(code: string) {
      if (!user) return;
      patch({ user: { ...user, language: code as "en" | "ar" } });
      applyLanguage(code);
      api("/auth/me", { method: "PATCH", body: { language: code } }).catch(
         () => {},
      );
   }

   async function onLogout() {
      await api("/auth/logout", { method: "POST" }).catch(() => {});
      await startSession(null);
      setOpenMenu(null);
      router.push("/");
   }

   return (
      <header id="navbar" className="navbar" ref={rootRef}>
         <Link href="/" className="logo">
            <span className="logo-mark">M</span>
            <span className="logo-text">MyApp</span>
         </Link>

         <form className="search" onSubmit={onSearch}>
            <Icon name="search" />
            <input
               ref={searchRef}
               type="search"
               name="q"
               placeholder={
                  user && business ? `Search ${business.name}` : "Search"
               }
            />
            <kbd>Ctrl+K</kbd>
         </form>

         <div className="nav-actions">
            {user ? (
               <div className="logged-in">
                  {business && (
                     <Link
                        href="/developer"
                        className="icon-btn hide-sm"
                        aria-label="Developer"
                     >
                        <Icon name="code" />
                     </Link>
                  )}
                  <Link
                     href="/help"
                     className="icon-btn hide-sm"
                     aria-label="Help"
                  >
                     <Icon name="help" />
                  </Link>
                  <Link
                     href="/updates"
                     className="icon-btn hide-sm"
                     aria-label="What's new"
                  >
                     <Icon name="sparkle" />
                  </Link>
                  <Link href="/messages" className="icon-btn" aria-label="Messages">
                     <Icon name="messages" />
                     <span className="badge" hidden={unread === 0}>
                        {unread > 9 ? "9+" : unread}
                     </span>
                  </Link>

                  <div className="dropdown">
                     <button
                        className="icon-btn"
                        aria-label="Notifications"
                        onClick={() => toggleMenu("notifications")}
                     >
                        <Icon name="bell" />
                        {unreadNotifs > 0 && (
                           <span className="badge">
                              {unreadNotifs > 9 ? "9+" : unreadNotifs}
                           </span>
                        )}
                     </button>
                     <div
                        className="dropdown-menu notif-menu"
                        hidden={openMenu !== "notifications"}
                     >
                        <div className="dropdown-title">Notifications</div>
                        {notifications.length ? (
                           notifications.map((n) => (
                              <div
                                 key={n.id}
                                 className={`notif-item ${n.read ? "" : "unread"}`}
                              >
                                 {n.text}
                                 <small>{timeAgo(n.createdAt)}</small>
                              </div>
                           ))
                        ) : (
                           <p className="notif-empty">
                              You&apos;re all caught up.
                           </p>
                        )}
                     </div>
                  </div>

                  <Link
                     href="/billing"
                     className="credit-pill"
                     title="Your credits"
                  >
                     <Icon name="coin" />
                     <span>{user.credits}</span>
                  </Link>

                  <div className="dropdown">
                     <button
                        className="avatar-btn"
                        aria-label="User menu"
                        aria-haspopup="true"
                        onClick={() => toggleMenu("user")}
                     >
                        <Avatar user={user} />
                     </button>

                     <div
                        className="dropdown-menu user-menu"
                        hidden={openMenu !== "user"}
                     >
                        <div className="user-info">
                           <Avatar user={user} size="avatar-lg" />
                           <div className="user-text">
                              <strong>{user.name}</strong>
                              <small>{user.email}</small>
                           </div>
                        </div>

                        <div className="menu-ws">
                           <p className="menu-title">Workspaces</p>
                           <button
                              className={`menu-item ${business ? "" : "current"}`}
                              onClick={() => switchWorkspace("personal")}
                           >
                              <span className="mi-icon">
                                 <Icon name="user" />
                              </span>
                              Personal
                           </button>
                           {businesses.map((b) => (
                              <button
                                 key={b.id}
                                 className={`menu-item ${b.id === workspace ? "current" : ""}`}
                                 onClick={() => switchWorkspace(b.id)}
                              >
                                 <span className="mi-icon ws-mini">
                                    {initials(b.name)}
                                 </span>
                                 {b.name}
                              </button>
                           ))}
                           <button
                              className="menu-item"
                              onClick={() => {
                                 setOpenMenu(null);
                                 bus.emit("business:new");
                              }}
                           >
                              <span className="mi-icon">
                                 <Icon name="plus" />
                              </span>
                              Start a business
                           </button>
                           <div className="menu-sep"></div>
                        </div>

                        <Link
                           href="/resolution"
                           className="menu-item"
                           onClick={() => setOpenMenu(null)}
                        >
                           <span className="mi-icon">
                              <Icon name="shield" />
                           </span>
                           Resolution Center
                        </Link>
                        <Link
                           href="/orders"
                           className="menu-item"
                           onClick={() => setOpenMenu(null)}
                        >
                           <span className="mi-icon">
                              <Icon name="orders" />
                           </span>
                           Orders
                        </Link>
                        <Link
                           href="/settings"
                           className="menu-item"
                           onClick={() => setOpenMenu(null)}
                        >
                           <span className="mi-icon">
                              <Icon name="settings" />
                           </span>
                           Settings
                        </Link>
                        <Link
                           href="/help"
                           className="menu-item"
                           onClick={() => setOpenMenu(null)}
                        >
                           <span className="mi-icon">
                              <Icon name="help" />
                           </span>
                           Help &amp; Support
                        </Link>

                        <div className="menu-item static">
                           <span className="mi-icon">
                              <Icon name="globe" />
                           </span>
                           Language
                           <select
                              className="mi-select"
                              aria-label="Language"
                              value={user.language}
                              onChange={(e) => onLanguage(e.target.value)}
                           >
                              {Object.entries(LANGUAGES).map(
                                 ([code, name]) => (
                                    <option key={code} value={code}>
                                       {name}
                                    </option>
                                 ),
                              )}
                           </select>
                        </div>

                        <Link
                           href="/legal"
                           className="menu-item"
                           onClick={() => setOpenMenu(null)}
                        >
                           <span className="mi-icon">
                              <Icon name="legal" />
                           </span>
                           Legal
                        </Link>

                        <div className="menu-sep"></div>

                        <div className="menu-item static">
                           <span className="mi-icon">
                              <Icon name="moon" />
                           </span>
                           Dark Mode
                           <button
                              type="button"
                              className="switch"
                              role="switch"
                              aria-label="Dark mode"
                              aria-checked={getTheme() === "dark"}
                              onClick={onToggleTheme}
                           ></button>
                        </div>

                        <div className="menu-sep"></div>

                        <button
                           className="menu-item danger"
                           onClick={onLogout}
                        >
                           <span className="mi-icon">
                              <Icon name="logout" />
                           </span>
                           Log Out
                        </button>
                     </div>
                  </div>
               </div>
            ) : ready ? (
               <button
                  className="btn btn-primary"
                  onClick={() => bus.emit("auth:open", "login")}
               >
                  Log in
               </button>
            ) : null}
         </div>
      </header>
   );
}
