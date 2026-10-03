"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "./Dialog";
import { cap } from "@/lib/client/biz";
import type { Field } from "@/lib/kinds";

export interface RefOption {
   id: string;
   name: string;
}

function FieldControl({
   fld,
   value,
   refs,
}: {
   fld: Field;
   value: unknown;
   refs: Record<string, RefOption[]>;
}) {
   const v = value ?? "";
   const str = String(v ?? "");

   switch (fld.type) {
      case "text":
         return (
            <textarea
               name={fld.name}
               rows={3}
               maxLength={fld.max || 500}
               required={fld.required}
               defaultValue={str}
            />
         );
      case "number":
         return (
            <input
               name={fld.name}
               type="number"
               step="0.01"
               min={fld.min ?? 0}
               max={fld.max || undefined}
               defaultValue={str}
               required={fld.required}
            />
         );
      case "enum":
         return (
            <select name={fld.name} defaultValue={str || String(fld.default ?? "")}>
               {(fld.options ?? []).map((o) => (
                  <option key={o} value={o}>
                     {cap(o)}
                  </option>
               ))}
            </select>
         );
      case "ref": {
         const list = refs[fld.ref ?? ""] || [];
         return (
            <select name={fld.name} required={fld.required} defaultValue={str}>
               {fld.required ? (
                  <option value="" disabled>
                     Choose...
                  </option>
               ) : (
                  <option value="">None</option>
               )}
               {list.map((o) => (
                  <option key={o.id} value={o.id}>
                     {o.name}
                  </option>
               ))}
            </select>
         );
      }
      case "bool":
         return (
            <input
               type="checkbox"
               name={fld.name}
               defaultChecked={v === true || (v === "" && Boolean(fld.default))}
            />
         );
      case "multi": {
         const selected = ([] as unknown[]).concat(v);
         return (
            <span className="multi">
               {(fld.options ?? []).map((o) => (
                  <label key={o}>
                     <input
                        type="checkbox"
                        name={fld.name}
                        value={o}
                        defaultChecked={selected.includes(o)}
                     />{" "}
                     {cap(o)}
                  </label>
               ))}
            </span>
         );
      }
      default:
         return (
            <input
               name={fld.name}
               type={fld.type === "email" ? "email" : "text"}
               maxLength={fld.max || 200}
               defaultValue={str}
               required={fld.required}
            />
         );
   }
}

/**
 * Spec-driven modal form — the fields use the same shape as lib/kinds.ts.
 * Collects values, awaits onSubmit, closes on success, shows the error
 * message inline on failure.
 */
export function FormDialog({
   open,
   title,
   intro = "",
   fields,
   values = {},
   refs = {},
   submitLabel = "Save",
   onSubmit,
   onClose,
}: {
   open: boolean;
   title: string;
   intro?: string;
   fields: Field[];
   values?: Record<string, unknown>;
   refs?: Record<string, RefOption[]>;
   submitLabel?: string;
   onSubmit: (out: Record<string, unknown>) => Promise<void>;
   onClose: () => void;
}) {
   const [error, setError] = useState("");
   const [busy, setBusy] = useState(false);
   const visible = fields.filter((f) => !f.hidden);

   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = e.currentTarget;
      const out: Record<string, unknown> = {};
      for (const f of visible) {
         if (f.type === "bool") {
            out[f.name] = (
               form.elements.namedItem(f.name) as HTMLInputElement
            ).checked;
         } else if (f.type === "multi") {
            out[f.name] = [
               ...form.querySelectorAll<HTMLInputElement>(
                  `input[name="${f.name}"]:checked`,
               ),
            ].map((i) => i.value);
         } else {
            out[f.name] = (
               form.elements.namedItem(f.name) as
                  | HTMLInputElement
                  | HTMLSelectElement
                  | HTMLTextAreaElement
            ).value;
         }
      }
      setBusy(true);
      setError("");
      try {
         await onSubmit(out);
         onClose();
      } catch (err) {
         setError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   return (
      <Dialog open={open} onClose={onClose} label={title}>
         <h2>{title}</h2>
         {intro && <p className="muted">{intro}</p>}
         <p className="error" role="alert" hidden={!error}>
            {error}
         </p>
         {open && (
            <form className="form" onSubmit={handleSubmit}>
               {visible.map((f) => (
                  <label
                     key={f.name}
                     className={`field ${f.type === "bool" ? "inline" : ""}`}
                  >
                     {f.label}
                     <FieldControl fld={f} value={values[f.name]} refs={refs} />
                  </label>
               ))}
               <button
                  className="btn btn-primary btn-block"
                  type="submit"
                  disabled={busy}
               >
                  {submitLabel}
               </button>
            </form>
         )}
      </Dialog>
   );
}
