"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/client/store";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Landing } from "./Landing";
import { AuthModal } from "@/components/auth/AuthModal";
import { BusinessModal } from "@/components/BusinessModal";
import { ToastHost } from "@/lib/client/toast";

export function AppShell({ children }: { children: ReactNode }) {
   const { user, ready, refreshUnread } = useSession();
   const pathname = usePathname();
   const path = pathname === "/" ? "home" : pathname.slice(1).split("/")[0];

   // Poll unread messages while logged in and the tab is visible
   useEffect(() => {
      const t = setInterval(() => {
         if (user && !document.hidden) refreshUnread();
      }, 15000);
      return () => clearInterval(t);
   }, [user, refreshUnread]);

   return (
      <>
         <Navbar />
         <div className="layout">
            <Sidebar />
            <main className={`main${path === "messages" ? " flush" : ""}`}>
               {ready && !user && <Landing />}
               <section id="view" hidden={!user}>
                  {user ? children : null}
               </section>
            </main>
         </div>
         <AuthModal />
         <BusinessModal />
         <ToastHost />
      </>
   );
}
