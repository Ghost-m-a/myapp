"use client";

import { api } from "./api";
import type { BizStats, RecordDTO } from "@/lib/types";
import type { Kind } from "@/lib/kinds";

let specPromise: Promise<Record<string, Kind>> | null = null;

export const getSpec = (): Promise<Record<string, Kind>> =>
   (specPromise ||= api<{ kinds: Record<string, Kind> }>("/biz/spec")
      .then((r) => r.kinds)
      .catch((e) => {
         specPromise = null;
         throw e;
      }));

export const listRecords = (bid: string, kind: string) =>
   api<{ records: RecordDTO[] }>(`/biz/${bid}/records/${kind}`).then(
      (r) => r.records,
   );

export const createRecord = (bid: string, kind: string, body: unknown) =>
   api<{ record: RecordDTO }>(`/biz/${bid}/records/${kind}`, {
      method: "POST",
      body,
   }).then((r) => r.record);

export const updateRecord = (
   bid: string,
   kind: string,
   id: string,
   body: unknown,
) =>
   api<{ record: RecordDTO }>(`/biz/${bid}/records/${kind}/${id}`, {
      method: "PATCH",
      body,
   }).then((r) => r.record);

export const deleteRecord = (bid: string, kind: string, id: string) =>
   api(`/biz/${bid}/records/${kind}/${id}`, { method: "DELETE" });

export const getStats = (bid: string, days = 14) =>
   api<BizStats>(`/biz/${bid}/stats?days=${days}`);

export const money = (n = 0): string =>
   `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   })}`;

export const date = (d: string | Date): string =>
   new Date(d).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
   });

export const cap = (s = ""): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Running balance per day, ending at the current balance. */
export function balanceSeries(stats: BizStats): number[] {
   let running = stats.window.start;
   return stats.series.map((d) => (running += d.in - d.out));
}

export interface CsvColumn<T> {
   label: string;
   val: (row: T) => unknown;
}

export function exportCsv<T>(name: string, cols: CsvColumn<T>[], rows: T[]) {
   const esc = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // blocks spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
   };
   const csv = [
      cols.map((c) => esc(c.label)),
      ...rows.map((r) => cols.map((c) => esc(c.val(r)))),
   ]
      .map((l) => l.join(","))
      .join("\n");
   const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: name,
   });
   a.click();
   URL.revokeObjectURL(a.href);
}
