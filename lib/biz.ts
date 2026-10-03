/**
 * Shared logic for the /api/biz routes — a direct port of the legacy
 * Express bizController: the ownership gate (load), the spec-driven
 * record validator/coercer (build), and the money totals aggregation.
 */
import mongoose, { type Types } from "mongoose";
import { ApiError } from "@/lib/http";
import kinds from "@/lib/kinds";
import Business, { type BusinessDoc } from "@/models/Business";
import RecordModel, { type RecordData } from "@/models/Record";

export const MAX_PER_KIND = 300;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const round2 = (n: number): number =>
   Math.round((n + Number.EPSILON) * 100) / 100;

/** Every /api/biz/:businessId/... request must belong to the logged-in owner. */
export async function loadBusiness(
   businessId: string,
   ownerId: Types.ObjectId | string,
): Promise<BusinessDoc> {
   const business = await Business.findOne({
      _id: businessId,
      owner: ownerId,
   });
   if (!business) throw new ApiError(404, "Business not found.");
   return business;
}

// ---------- validation ----------
/** Validates/coerces `body` against the kind spec. Throws ApiError(400). */
export async function build(
   kind: string,
   body: Record<string, unknown>,
   business: BusinessDoc,
   prev: RecordData = {},
): Promise<RecordData> {
   const data: RecordData = { ...prev };

   for (const fld of kinds[kind].fields) {
      if (!(fld.name in body) && fld.name in prev) continue;
      const v = body[fld.name];

      if (v === undefined || v === null || v === "") {
         if (fld.required)
            throw new ApiError(400, `${fld.label} is required.`);
         if (fld.default !== undefined) data[fld.name] = fld.default;
         else delete data[fld.name];
         continue;
      }

      switch (fld.type) {
         case "number": {
            const n = Number(v);
            if (
               !Number.isFinite(n) ||
               n < (fld.min ?? 0) ||
               n > (fld.max ?? 1e9)
            )
               throw new ApiError(
                  400,
                  `${fld.label} must be between ${fld.min ?? 0} and ${fld.max ?? 1e9}.`,
               );
            data[fld.name] = round2(n);
            break;
         }
         case "bool":
            data[fld.name] = v === true || v === "true" || v === "on";
            break;
         case "enum":
            if (!(fld.options as string[]).includes(v as string))
               throw new ApiError(400, `Invalid ${fld.label.toLowerCase()}.`);
            data[fld.name] = v;
            break;
         case "ref":
            if (
               !mongoose.isValidObjectId(v) ||
               !(await RecordModel.exists({
                  _id: v as string,
                  business: business._id,
                  kind: fld.ref,
               }))
            )
               throw new ApiError(
                  400,
                  `Choose a valid ${fld.label.toLowerCase()}.`,
               );
            data[fld.name] = String(v);
            break;
         default: {
            let s = String(v)
               .trim()
               .slice(0, fld.max || 200);
            if (fld.upper) s = s.toUpperCase();
            if (fld.type === "email" && !EMAIL.test(s))
               throw new ApiError(400, `${fld.label} is not a valid email.`);
            data[fld.name] = s;
         }
      }
   }
   return data;
}

// ---------- money ----------
export interface Totals {
   payment: number;
   deposit: number;
   withdrawal: number;
   count: number;
   balance: number;
   [type: string]: number;
}

export async function totals(
   businessId: Types.ObjectId | string,
   since?: Date,
): Promise<Totals> {
   const match: Record<string, unknown> = {
      business: businessId,
      kind: "payment",
      "data.status": "succeeded",
   };
   if (since) match.createdAt = { $gte: since };
   const rows = await RecordModel.aggregate<{
      _id: string;
      sum: number;
      n: number;
   }>([
      { $match: match },
      {
         $group: {
            _id: "$data.type",
            sum: { $sum: "$data.amount" },
            n: { $sum: 1 },
         },
      },
   ]);
   const t: Totals = {
      payment: 0,
      deposit: 0,
      withdrawal: 0,
      count: 0,
      balance: 0,
   };
   rows.forEach((r) => {
      t[r._id] = round2(r.sum);
      if (r._id === "payment") t.count = r.n;
   });
   t.balance = round2(t.payment + t.deposit - t.withdrawal);
   return t;
}
