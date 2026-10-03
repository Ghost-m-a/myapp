import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { loadBusiness, build } from "@/lib/biz";
import kinds from "@/lib/kinds";
import RecordModel from "@/models/Record";

type Ctx = {
   params: Promise<{ businessId: string; kind: string; id: string }>;
};

export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
   const { businessId, kind, id } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);
   if (!kinds[kind]) return fail(404, "Unknown type.");
   if (kinds[kind].immutable)
      return fail(403, "This can't be edited. Delete it and add a new one.");

   const record = await RecordModel.findOne({
      _id: id,
      business: business._id,
      kind,
   });
   if (!record) return fail(404, "Not found.");

   const before = record.data;
   const body = await req.json();
   const data = await build(kind, body, business, before);

   // Marking an invoice as paid books the money
   if (
      kind === "invoice" &&
      before.status !== "paid" &&
      data.status === "paid"
   ) {
      await RecordModel.create({
         business: business._id,
         kind: "payment",
         data: {
            type: "payment",
            amount: data.amount,
            email: data.email,
            method: "manual",
            status: "succeeded",
         },
      });
   }

   record.data = data;
   record.markModified("data");
   await record.save();
   return NextResponse.json({ record });
});

export const DELETE = route(async (_req: NextRequest, ctx: Ctx) => {
   const { businessId, kind, id } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);
   if (!kinds[kind]) return fail(404, "Unknown type.");
   const record = await RecordModel.findOneAndDelete({
      _id: id,
      business: business._id,
      kind,
   });
   if (!record) return fail(404, "Not found.");
   return NextResponse.json({ ok: true });
});
