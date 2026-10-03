"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { bus } from "@/lib/client/bus";
import { api } from "@/lib/client/api";
import { useSession } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import { Icon } from "@/lib/client/icons";
import type { BusinessDTO } from "@/lib/types";

export function BusinessModal() {
   const router = useRouter();
   const { businesses, patch, setWorkspace, refreshNotifications } =
      useSession();
   const [open, setOpen] = useState(false);
   const [error, setError] = useState("");
   const [busy, setBusy] = useState(false);
   const formRef = useRef<HTMLFormElement>(null);

   useEffect(
      () =>
         bus.on("business:new", () => {
            setError("");
            setOpen(true);
            setTimeout(
               () =>
                  formRef.current
                     ?.querySelector<HTMLInputElement>('[name="name"]')
                     ?.focus(),
               0,
            );
         }),
      [],
   );

   useEffect(() => {
      document.body.classList.toggle("modal-open", open);
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") close();
      };
      if (open) document.addEventListener("keydown", onKey);
      return () => {
         document.body.classList.remove("modal-open");
         document.removeEventListener("keydown", onKey);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open]);

   function close() {
      setOpen(false);
      formRef.current?.reset();
   }

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      setBusy(true);
      try {
         const { business } = await api<{ business: BusinessDTO }>(
            "/businesses",
            {
               method: "POST",
               body: {
                  name: data.get("name"),
                  description: data.get("description"),
               },
            },
         );
         patch({ businesses: [...businesses, business] });
         setWorkspace(business.id);
         router.push("/");
         close();
         toast(`${business.name} created`);
         refreshNotifications().catch(() => {});
      } catch (err) {
         setError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   return (
      <div
         className="modal"
         hidden={!open}
         onClick={(e) => {
            if (e.target === e.currentTarget) close();
         }}
      >
         <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Start a business"
         >
            <button
               className="icon-btn modal-close"
               aria-label="Close"
               onClick={close}
            >
               <Icon name="close" />
            </button>
            <h2>Start a business</h2>
            <p className="muted">
               A business gets its own workspace for products, customers and
               payments.
            </p>
            <p className="error" role="alert" hidden={!error}>
               {error}
            </p>
            <form className="form" ref={formRef} onSubmit={onSubmit}>
               <label className="field">
                  Business name
                  <input
                     name="name"
                     maxLength={40}
                     required
                     placeholder="Spark & Learn"
                  />
               </label>
               <label className="field">
                  Description <small>(optional)</small>
                  <textarea
                     name="description"
                     maxLength={200}
                     rows={3}
                  ></textarea>
               </label>
               <button
                  className="btn btn-primary btn-block"
                  type="submit"
                  disabled={busy}
               >
                  Create business
               </button>
            </form>
         </div>
      </div>
   );
}
