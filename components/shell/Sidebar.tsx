"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/client/store";
import { bus } from "@/lib/client/bus";
import { Icon } from "@/lib/client/icons";
import { Avatar } from "@/components/Avatar";
import { initials } from "@/lib/client/utils";
import { getNav, hrefFor, type NavItem, type NavSection } from "@/lib/nav";

export function Sidebar() {
   const { user, businesses, business, unread, setWorkspace } = useSession();
   const pathname = usePathname();
   const router = useRouter();
   const [collapsed, setCollapsed] = useState(false);
   const [moreOpen, setMoreOpen] = useState(false);

   const path = pathname === "/" ? "home" : pathname.slice(1).split("/")[0];
   const nav = getNav({ business, role: user?.role ?? "creator" });

   // Open "More" when you navigate to one of its pages
   useEffect(() => {
      if (
         nav.sections
            .find((s) => s.more)
            ?.items.some((i) => i.path === path)
      )
         setMoreOpen(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [path]);

   if (!user) return <aside id="sidebar" hidden />;

   function link(i: NavItem, extra = "") {
      return (
         <Link
            key={i.path}
            href={hrefFor(i)}
            className={`side-link ${path === i.path ? "active" : ""} ${extra}`}
            title={i.name}
         >
            <span className="side-icon">
               <Icon name={i.icon} />
               {i.path === "messages" && (
                  <span className="dot" hidden={unread === 0}>
                     {unread > 9 ? "9+" : unread}
                  </span>
               )}
            </span>
            <span className="side-text">{i.name}</span>
            {i.tag && <em className="tag">{i.tag}</em>}
            {i.arrow && (
               <span className="chev-r">
                  <Icon name="arrowRight" />
               </span>
            )}
         </Link>
      );
   }

   function section(s: NavSection, idx: number) {
      if (s.more) {
         return (
            <div className="side-section" key="more">
               <button
                  className="side-link side-more"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((o) => !o)}
               >
                  <span className="side-icon">
                     <Icon name="dots" />
                  </span>
                  <span className="side-text">More</span>
                  <span className="chev">
                     <Icon name="chevronDown" />
                  </span>
               </button>
               <div className="side-more-list" hidden={!moreOpen}>
                  {s.items.map((i) => link(i))}
               </div>
            </div>
         );
      }
      return (
         <div className="side-section" key={s.label ?? idx}>
            <p className="side-label">{s.label}</p>
            {s.items.map((i, n) => link(i, idx === 0 && n < 5 ? "mob" : ""))}
         </div>
      );
   }

   return (
      <aside
         id="sidebar"
         className={`sidebar${collapsed ? " collapsed" : ""}`}
      >
         <div className="workspaces">
            <button
               className={`ws-tile ${business ? "" : "active"}`}
               title="Personal"
               aria-label="Personal workspace"
               onClick={() => {
                  setWorkspace("personal");
                  router.push("/");
               }}
            >
               <Icon name="user" />
            </button>
            {businesses.map((b) => (
               <button
                  key={b.id}
                  className={`ws-tile ws-initials ${b.id === business?.id ? "active" : ""}`}
                  title={b.name}
                  aria-label={b.name}
                  onClick={() => {
                     setWorkspace(b.id);
                     router.push("/");
                  }}
               >
                  {initials(b.name)}
               </button>
            ))}
            <button
               className="ws-tile ws-add"
               title="Start a business"
               aria-label="Start a business"
               onClick={() => bus.emit("business:new")}
            >
               <Icon name="plus" />
            </button>
         </div>

         <nav className="side-nav">
            {nav.sections.map((s, idx) => section(s, idx))}
            <Link
               href="/settings"
               className={`side-link side-profile ${path === "settings" ? "active" : ""}`}
               title="Profile"
            >
               <span className="side-icon">
                  <Avatar user={user} />
               </span>
            </Link>
         </nav>

         <div className="side-bottom">
            <div className="side-bottom-links">
               {nav.bottom.map((i) => link(i))}
            </div>
            <button
               className="icon-btn collapse-btn"
               aria-label="Collapse sidebar"
               onClick={() => setCollapsed((c) => !c)}
            >
               <Icon name="panel" />
            </button>
         </div>
      </aside>
   );
}
