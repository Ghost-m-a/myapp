import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { loadBusiness, round2 } from "@/lib/biz";
import type { CustomerDTO } from "@/lib/types";
import RecordModel from "@/models/Record";

type Ctx = { params: Promise<{ businessId: string }> };

export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
   const { businessId } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);

   const rows = await RecordModel.aggregate<{
      _id: string;
      spend: number;
      payments: number;
      joined: Date;
      last: Date;
   }>([
      {
         $match: {
            business: business._id,
            kind: "payment",
            "data.status": "succeeded",
            "data.type": "payment",
            "data.email": { $exists: true, $ne: "" },
         },
      },
      {
         $group: {
            _id: "$data.email",
            spend: { $sum: "$data.amount" },
            payments: { $sum: 1 },
            joined: { $min: "$createdAt" },
            last: { $max: "$createdAt" },
         },
      },
      { $sort: { last: -1 } },
      { $limit: 200 },
   ]);
   const customers: CustomerDTO[] = rows.map((r) => ({
      email: r._id,
      spend: round2(r.spend),
      payments: r.payments,
      joined: r.joined.toISOString(),
      last: r.last.toISOString(),
   }));
   return NextResponse.json({ customers });
});
