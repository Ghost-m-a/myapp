import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Business from "@/models/Business";
import Campaign from "@/models/Campaign";

export const GET = route(async () => {
   const user = await getSessionUser();
   const businesses =
      user.role === "advertiser"
         ? await Business.find({ owner: user._id }).select("_id")
         : [];
   const match =
      user.role === "advertiser"
         ? { business: { $in: businesses.map((business) => business._id) } }
         : { participants: user._id };

   const [totals, series, recent] = await Promise.all([
      Campaign.aggregate<{
         campaigns: number;
         budget: number;
         participants: number;
         averageCpm: number;
      }>([
         { $match: match },
         {
            $group: {
               _id: null,
               campaigns: { $sum: 1 },
               budget: { $sum: "$budget" },
               participants: {
                  $sum: { $size: { $ifNull: ["$participants", []] } },
               },
               averageCpm: { $avg: "$cpm" },
            },
         },
      ]),
      Campaign.aggregate<{
         month: string;
         campaigns: number;
         budget: number;
         participants: number;
      }>([
         { $match: match },
         {
            $group: {
               _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
               campaigns: { $sum: 1 },
               budget: { $sum: "$budget" },
               participants: {
                  $sum: { $size: { $ifNull: ["$participants", []] } },
               },
            },
         },
         { $sort: { _id: -1 } },
         { $limit: 6 },
         {
            $project: {
               _id: 0,
               month: "$_id",
               campaigns: 1,
               budget: 1,
               participants: 1,
            },
         },
      ]),
      Campaign.find(match)
         .sort({ createdAt: -1 })
         .limit(5)
         .populate("business", "name"),
   ]);

   return NextResponse.json({
      summary: totals[0] || {
         campaigns: 0,
         budget: 0,
         participants: 0,
         averageCpm: 0,
      },
      series: series.reverse(),
      recent: recent.map((campaign) => ({
         id: campaign.id,
         title: campaign.title,
         budget: campaign.budget,
         participants: campaign.participants.length,
         createdAt: campaign.createdAt.toISOString(),
         business:
            campaign.business &&
            typeof campaign.business === "object" &&
            "name" in campaign.business
               ? String(campaign.business.name)
               : "Business",
      })),
   });
});
