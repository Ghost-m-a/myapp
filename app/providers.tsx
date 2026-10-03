"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/client/store";
import { AppShell } from "@/components/shell/AppShell";

export function Providers({ children }: { children: ReactNode }) {
   return (
      <SessionProvider>
         <AppShell>{children}</AppShell>
      </SessionProvider>
   );
}
