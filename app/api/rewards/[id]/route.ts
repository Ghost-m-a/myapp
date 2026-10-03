import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Campaign from "@/models/Campaign";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const campaign = await Campaign.findById(id).populate("business", "owner");
   const biz = campaign?.business as unknown as {
      owner?: Types.ObjectId | null;
   } | null;
   if (!campaign || !biz?.owner?.equals(me._id))
      return fail(404, "Campaign not found.");
   await campaign.deleteOne();
   return NextResponse.json({ ok: true });
});
