"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/lib/client/icons";

// Refcount so nested dialogs don't remove the body class too early.
let openCount = 0;

export function Dialog({
   open,
   onClose,
   wide = true,
   label,
   children,
}: {
   open: boolean;
   onClose: () => void;
   wide?: boolean;
   label?: string;
   children: ReactNode;
}) {
   useEffect(() => {
      if (!open) return;
      openCount++;
      document.body.classList.add("modal-open");
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => {
         document.removeEventListener("keydown", onKey);
         if (--openCount <= 0) {
            openCount = 0;
            document.body.classList.remove("modal-open");
         }
      };
   }, [open, onClose]);

   if (!open) return null;

   return (
      <div
         className="modal"
         onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
         }}
      >
         <div
            className={`dialog${wide ? " wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
         >
            <button
               className="icon-btn modal-close"
               aria-label="Close"
               onClick={onClose}
            >
               <Icon name="close" />
            </button>
            {children}
         </div>
      </div>
   );
}
