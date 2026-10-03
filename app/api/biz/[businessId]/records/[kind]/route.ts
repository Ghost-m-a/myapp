import { NextRequest, NextResponse } from "next/server";
import { route, fail, ApiError } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { loadBusiness, build, totals, round2, MAX_PER_KIND } from "@/lib/biz";
import kinds from "@/lib/kinds";
import RecordModel from "@/models/Record";

type Ctx = { params: Promise<{ businessId: string; kind: string }> };

export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
   const { businessId, kind } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);
   if (!kinds[kind]) return fail(404, "Unknown type.");
   const bid = business._id;

   const rows = (
      await RecordModel.find({ business: bid, kind })
         .sort({ createdAt: -1 })
         .limit(200)
   ).map((d) => d.toJSON() as unknown as Record<string, unknown>);

   if (kind === "product" || kinds[kind].fields.some((f) => f.type === "ref")) {
      const products = await RecordModel.find({
         business: bid,
         kind: "product",
      });
      const names = Object.fromEntries(
         products.map((p) => [p.id, p.data.name] as const),
      );

      let sold: Record<string, { _id: string; n: number; revenue: number }> =
         {};
      if (kind === "product") {
         const agg = await RecordModel.aggregate<{
            _id: string;
            n: number;
            revenue: number;
         }>([
            {
               $match: {
                  business: bid,
                  kind: "payment",
                  "data.status": "succeeded",
                  "data.type": "payment",
               },
            },
            {
               $group: {
                  _id: "$data.product",
                  n: { $sum: 1 },
                  revenue: { $sum: "$data.amount" },
               },
            },
         ]);
         sold = Object.fromEntries(agg.map((a) => [a._id, a] as const));
      }
      rows.forEach((r) => {
         r.productName = names[r.product as string] || "";
         if (kind === "product") {
            r.sales = sold[r.id as string]?.n || 0;
            r.revenue = round2(sold[r.id as string]?.revenue || 0);
         }
      });
   }
   return NextResponse.json({ records: rows });
});

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
   const { businessId, kind } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);
   if (!kinds[kind]) return fail(404, "Unknown type.");

   if (
      (await RecordModel.countDocuments({ business: business._id, kind })) >=
      MAX_PER_KIND
   )
      throw new ApiError(
         400,
         "You've reached the limit for this page. Delete something first.",
      );

   const body = await req.json();
   const data = await build(kind, body, business);

   if (kind === "payment") {
      if (data.type === "payment" && !data.email)
         throw new ApiError(400, "Customer email is required for payments.");
      if (data.type === "withdrawal" && data.status === "succeeded") {
         const t = await totals(business._id);
         if ((data.amount as number) > t.balance)
            throw new ApiError(400, "Not enough balance for this withdrawal.");
      }
   }

   const record = await RecordModel.create({
      business: business._id,
      kind,
      data,
   });
   return NextResponse.json({ record }, { status: 201 });
});
