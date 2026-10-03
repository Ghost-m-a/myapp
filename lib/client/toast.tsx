"use client";

import { useEffect, useState } from "react";

interface ToastItem {
   id: number;
   message: string;
}

let push: ((message: string) => void) | null = null;

/** Show a transient toast (auto-dismisses after ~2.6s). */
export function toast(message: string) {
   push?.(message);
}

export function ToastHost() {
   const [items, setItems] = useState<ToastItem[]>([]);

   useEffect(() => {
      let next = 0;
      push = (message: string) => {
         const id = ++next;
         setItems((list) => [...list, { id, message }]);
         setTimeout(
            () => setItems((list) => list.filter((t) => t.id !== id)),
            2600,
         );
      };
      return () => {
         push = null;
      };
   }, []);

   return (
      <>
         {items.map((t) => (
            <div key={t.id} className="toast">
               {t.message}
            </div>
         ))}
      </>
   );
}
