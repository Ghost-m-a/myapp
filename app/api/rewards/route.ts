import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { route, fail, escapeRegex } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import type { CampaignDTO } from "@/lib/types";
import type { UserDoc } from "@/models/User";
import Business from "@/models/Business";
import Campaign from "@/models/Campaign";

const PLATFORMS = ["tiktok", "instagram", "youtube", "x"];
const CATEGORIES = [
   "gaming",
   "technology",
   "finance",
   "lifestyle",
   "music",
   "other",
];

const txt = (v: unknown, max: number): string =>
   String(v ?? "")
      .trim()
      .slice(0, max);

/** Campaign doc with `business` populated (name + owner). */
export interface CampaignWithBiz {
   id: string;
   title: string;
   description: string;
   category: string;
   cpm: number;
   budget: number;
   platforms: string[];
   participants: Types.ObjectId[];
   business: {
      id: string;
      name: string;
      owner?: Types.ObjectId | null;
   } | null;
   createdAt: Date;
}

export const shape = (c: CampaignWithBiz, me: UserDoc): CampaignDTO => ({
   id: c.id,
   title: c.title,
   description: c.description,
   category: c.category,
   cpm: c.cpm,
   budget: c.budget,
   spent: 0, // becomes real when clip submissions are tracked
   platforms: c.platforms,
   participants: c.participants.length,
   joined: c.participants.some((p) => p.equals(me._id)),
   mine: Boolean(c.business?.owner && c.business.owner.equals(me._id)),
   business: c.business ? { id: c.business.id, name: c.business.name } : null,
   createdAt: c.createdAt.toISOString(),
});

export const GET = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const q = txt(req.nextUrl.searchParams.get("q"), 40);
   const filter = q
      ? { title: { $regex: escapeRegex(q), $options: "i" } }
      : {};
   const sortParam = req.nextUrl.searchParams.get("sort");
   const sort: Record<string, 1 | -1> =
      sortParam === "cpm"
         ? { cpm: -1 }
         : sortParam === "budget"
           ? { budget: -1 }
           : { createdAt: -1 };

   const list = (await Campaign.find(filter)
      .sort(sort)
      .limit(60)
      .populate("business", "name owner")) as unknown as CampaignWithBiz[];
   return NextResponse.json({ campaigns: list.map((c) => shape(c, me)) });
});

export const POST = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const body = await req.json();

   const business = await Business.findOne({
      _id: body.businessId,
      owner: me._id,
   });
   if (!business) return fail(400, "Choose one of your businesses.");

   const title = txt(body.title, 80);
   if (title.length < 3)
      return fail(400, "Title must be at least 3 characters.");

   const cpm = Number(body.cpm);
   const budget = Number(body.budget);
   if (!(cpm > 0 && cpm <= 1000))
      return fail(400, "Pay per 1K views must be between 0.01 and 1000.");
   if (!(budget >= 1 && budget <= 1000000))
      return fail(400, "Budget must be between 1 and 1,000,000.");

   const platforms = ([] as unknown[])
      .concat(body.platforms || [])
      .filter((p) => PLATFORMS.includes(p as string)) as string[];
   if (!platforms.length) return fail(400, "Pick at least one platform.");

   const campaign = await Campaign.create({
      business: business._id,
      title,
      description: txt(body.description, 500),
      category: CATEGORIES.includes(body.category) ? body.category : "other",
      cpm,
      budget,
      platforms,
   });
   await campaign.populate("business", "name owner");
   return NextResponse.json(
      { campaign: shape(campaign as unknown as CampaignWithBiz, me) },
      { status: 201 },
   );
});
