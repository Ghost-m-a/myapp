import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Campaign from "@/models/Campaign";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const campaign = await Campaign.findById(id).populate(
      "business",
      "name owner",
   );
   if (!campaign) return fail(404, "Campaign not found.");
   const biz = campaign.business as unknown as {
      owner?: Types.ObjectId | null;
   } | null;
   if (biz?.owner?.equals(me._id))
      return fail(400, "You can't join your own campaign.");

   const joined = campaign.participants.some((p) => p.equals(me._id));
   await Campaign.updateOne(
      { _id: campaign._id },
      joined
         ? { $pull: { participants: me._id } }
         : { $addToSet: { participants: me._id } },
   );
   return NextResponse.json({
      joined: !joined,
      participants: campaign.participants.length + (joined ? -1 : 1),
   });
});
