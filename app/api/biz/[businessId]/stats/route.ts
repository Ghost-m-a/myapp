import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { loadBusiness, totals, round2 } from "@/lib/biz";
import type { BizStats } from "@/lib/types";
import RecordModel from "@/models/Record";

type Ctx = { params: Promise<{ businessId: string }> };

export const GET = route(async (req: NextRequest, ctx: Ctx) => {
   const { businessId } = await ctx.params;
   const me = await getSessionUser();
   const business = await loadBusiness(businessId, me._id);

   const bid = business._id;
   const days = Math.min(
      365,
      Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 14),
   );

   const since = new Date();
   since.setUTCHours(0, 0, 0, 0);
   since.setUTCDate(since.getUTCDate() - (days - 1));

   const [all, win, daily, customerEmails, kindCounts] = await Promise.all([
      totals(bid),
      totals(bid, since),
      RecordModel.aggregate<{ _id: { d: string; t: string }; sum: number }>([
         {
            $match: {
               business: bid,
               kind: "payment",
               "data.status": "succeeded",
               createdAt: { $gte: since },
            },
         },
         {
            $group: {
               _id: {
                  d: {
                     $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                     },
                  },
                  t: "$data.type",
               },
               sum: { $sum: "$data.amount" },
            },
         },
      ]),
      RecordModel.distinct("data.email", {
         business: bid,
         kind: "payment",
         "data.status": "succeeded",
         "data.type": "payment",
      }),
      RecordModel.aggregate<{ _id: string; n: number }>([
         { $match: { business: bid } },
         { $group: { _id: "$kind", n: { $sum: 1 } } },
      ]),
   ]);

   const byDay: Record<string, { in: number; out: number }> = {};
   daily.forEach((r) => {
      const d = (byDay[r._id.d] ||= { in: 0, out: 0 });
      if (r._id.t === "withdrawal") d.out += r.sum;
      else d.in += r.sum;
   });

   const series: { day: string; in: number; out: number }[] = [];
   for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000)
         .toISOString()
         .slice(0, 10);
      series.push({
         day: d,
         in: round2(byDay[d]?.in || 0),
         out: round2(byDay[d]?.out || 0),
      });
   }

   const winIn = round2(win.payment + win.deposit);
   const customers = customerEmails.filter(Boolean).length;

   const stats: BizStats = {
      balance: all.balance,
      revenue: all.payment,
      payments: all.count,
      customers,
      avg: customers ? round2(all.payment / customers) : 0,
      today: series[series.length - 1].in,
      window: {
         in: winIn,
         out: win.withdrawal,
         deposits: win.deposit,
         withdrawals: win.withdrawal,
         start: round2(all.balance - (winIn - win.withdrawal)),
      },
      series,
      counts: Object.fromEntries(
         kindCounts.map((k) => [k._id, k.n] as const),
      ),
   };
   return NextResponse.json(stats);
});
