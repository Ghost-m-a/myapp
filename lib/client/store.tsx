"use client";

import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react";
import { api } from "./api";
import { setTheme, applyLanguage } from "./theme";
import type { BusinessDTO, NotificationDTO, UserDTO } from "@/lib/types";

export interface SessionState {
   user: UserDTO | null;
   businesses: BusinessDTO[];
   notifications: NotificationDTO[];
   workspace: string; // "personal" or a business id
   unread: number;
   /** false until the initial /auth/me boot completes */
   ready: boolean;
}

interface SessionContextValue extends SessionState {
   /** The business matching the current workspace, or null. */
   business: BusinessDTO | null;
   patch: (p: Partial<SessionState>) => void;
   setWorkspace: (id: string) => void;
   startSession: (user: UserDTO | null) => Promise<void>;
   refreshNotifications: () => Promise<void>;
   refreshUnread: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const initial: SessionState = {
   user: null,
   businesses: [],
   notifications: [],
   workspace: "personal",
   unread: 0,
   ready: false,
};

export function SessionProvider({ children }: { children: ReactNode }) {
   const [state, setState] = useState<SessionState>(initial);

   const patch = useCallback(
      (p: Partial<SessionState>) => setState((s) => ({ ...s, ...p })),
      [],
   );

   const setWorkspace = useCallback((id: string) => {
      localStorage.setItem("workspace", id);
      setState((s) => ({ ...s, workspace: id }));
   }, []);

   const refreshUnread = useCallback(async () => {
      try {
         const { unread } = await api<{ unread: number }>(
            "/messages/conversations",
         );
         setState((s) => ({ ...s, unread }));
      } catch {
         /* not logged in or transient — keep previous value */
      }
   }, []);

   const refreshNotifications = useCallback(async () => {
      const { notifications } = await api<{
         notifications: NotificationDTO[];
      }>("/notifications");
      setState((s) => ({ ...s, notifications }));
   }, []);

   const startSession = useCallback(
      async (user: UserDTO | null) => {
         if (!user) {
            setState((s) => ({
               ...s,
               user: null,
               businesses: [],
               notifications: [],
               workspace: "personal",
               unread: 0,
               ready: true,
            }));
            return;
         }

         const [{ businesses }, { notifications }] = await Promise.all([
            api<{ businesses: BusinessDTO[] }>("/businesses"),
            api<{ notifications: NotificationDTO[] }>("/notifications"),
         ]);

         const saved = localStorage.getItem("workspace");
         const workspace = businesses.some((b) => b.id === saved)
            ? (saved as string)
            : "personal";

         if (user.theme) setTheme(user.theme);
         applyLanguage(user.language);

         setState((s) => ({
            ...s,
            user,
            businesses,
            notifications,
            workspace,
            ready: true,
         }));
         refreshUnread();
      },
      [refreshUnread],
   );

   // Boot: capture ?ref=, then load the current session.
   useEffect(() => {
      const ref = new URLSearchParams(location.search).get("ref");
      if (ref) {
         localStorage.setItem("ref", ref);
         history.replaceState(null, "", location.pathname);
      }

      (async () => {
         try {
            const { user } = await api<{ user: UserDTO }>("/auth/me");
            await startSession(user);
         } catch {
            await startSession(null); // a 401 here is normal
         }
      })();
   }, [startSession]);

   const business = useMemo(
      () => state.businesses.find((b) => b.id === state.workspace) || null,
      [state.businesses, state.workspace],
   );

   const value = useMemo<SessionContextValue>(
      () => ({
         ...state,
         business,
         patch,
         setWorkspace,
         startSession,
         refreshNotifications,
         refreshUnread,
      }),
      [
         state,
         business,
         patch,
         setWorkspace,
         startSession,
         refreshNotifications,
         refreshUnread,
      ],
   );

   return (
      <SessionContext.Provider value={value}>
         {children}
      </SessionContext.Provider>
   );
}

export function useSession(): SessionContextValue {
   const ctx = useContext(SessionContext);
   if (!ctx) throw new Error("useSession must be used inside SessionProvider");
   return ctx;
}
