import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { route, fail, escapeRegex } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Campaign, { type CampaignDoc } from "@/models/Campaign";
import Business from "@/models/Business";

interface CampaignView {
   id: string;
   title: string;
   description: string;
   category: string;
   cpm: number;
   budget: number;
   spent: number;
   platforms: string[];
   participants: number;
   joined: boolean;
   mine: boolean;
   business: { id: string; name: string } | null;
   createdAt: string;
}

type PopulatedCampaign = Omit<CampaignDoc, "business"> & {
   business: { id: string; name: string } | null;
};

function shapeCampaign(
   campaign: PopulatedCampaign,
   userId: string,
   ownedBusinessIds: Set<string>,
): CampaignView {
   const business = campaign.business;
   return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      cpm: campaign.cpm,
      budget: campaign.budget,
      spent: 0,
      platforms: campaign.platforms,
      participants: campaign.participants.length,
      joined: campaign.participants.some(
         (participant) => String(participant) === userId,
      ),
      mine: business ? ownedBusinessIds.has(String(business.id)) : false,
      business: business
         ? { id: String(business.id), name: business.name }
         : null,
      createdAt: campaign.createdAt.toISOString(),
   };
}

export const GET = route(async (req: NextRequest) => {
   const user = await getSessionUser();
   const q = String(req.nextUrl.searchParams.get("q") || "")
      .trim()
      .slice(0, 60);
   const ownedBusinesses = await Business.find({ owner: user._id }).select(
      "_id",
   );
   const ownedBusinessIds = new Set(
      ownedBusinesses.map((business) => String(business._id)),
   );
   const filter = q ? { title: { $regex: escapeRegex(q), $options: "i" } } : {};
   const query =
      user.role === "advertiser"
         ? {
              ...filter,
              business: {
                 $in: ownedBusinesses.map((business) => business._id),
              },
           }
         : filter;
   const campaigns = (await Campaign.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("business", "name")) as unknown as PopulatedCampaign[];

   return NextResponse.json({
      campaigns: campaigns.map((campaign) =>
         shapeCampaign(campaign, user.id, ownedBusinessIds),
      ),
   });
});

export const POST = route(async (req: NextRequest) => {
   const user = await getSessionUser();
   if (user.role !== "advertiser")
      return fail(403, "Only advertisers can create campaigns.");

   const body = await req.json();
   const title = String(body.title || "")
      .trim()
      .slice(0, 80);
   const description = String(body.description || "")
      .trim()
      .slice(0, 500);
   const category = String(body.category || "other")
      .trim()
      .toLowerCase()
      .slice(0, 40);
   const cpm = Number(body.cpm);
   const budget = Number(body.budget);
   const businessId = String(body.businessId || "");
   if (!mongoose.isValidObjectId(businessId))
      return fail(400, "Choose a valid business.");
   const business = await Business.findOne({
      _id: businessId,
      owner: user._id,
   });
   const platforms: string[] = Array.isArray(body.platforms)
      ? Array.from(
           new Set<string>(
              body.platforms
                 .map((value: unknown) => String(value).trim().slice(0, 24))
                 .filter((value: string) => Boolean(value)),
           ),
        ).slice(0, 8)
      : [];

   if (!business) return fail(404, "Choose one of your businesses.");
   if (title.length < 3)
      return fail(400, "Campaign title must be at least 3 characters.");
   if (!Number.isFinite(cpm) || cpm <= 0 || cpm > 1000000)
      return fail(400, "CPM must be a positive amount.");
   if (!Number.isFinite(budget) || budget < cpm || budget > 100000000)
      return fail(
         400,
         "Budget must be at least one CPM and within the supported limit.",
      );
   if (!platforms.length) return fail(400, "Choose at least one platform.");

   const campaign = await Campaign.create({
      business: business._id,
      title,
      description,
      category: category || "other",
      cpm,
      budget,
      platforms,
      participants: [],
   });
   await campaign.populate("business", "name");
   const ownedBusinessIds = new Set([String(business._id)]);
   return NextResponse.json(
      {
         campaign: shapeCampaign(
            campaign as unknown as PopulatedCampaign,
            user.id,
            ownedBusinessIds,
         ),
      },
      { status: 201 },
   );
});
