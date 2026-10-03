import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Campaign from "@/models/Campaign";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req, ctx: Ctx) => {
   const user = await getSessionUser();
   if (user.role !== "creator")
      return fail(403, "Only creators can join campaigns.");

   const { id } = await ctx.params;
   if (!mongoose.isValidObjectId(id)) return fail(404, "Campaign not found.");
   const campaign = await Campaign.findById(id);
   if (!campaign) return fail(404, "Campaign not found.");

   const alreadyJoined = campaign.participants.some((participant) =>
      participant.equals(user._id),
   );
   if (!alreadyJoined) {
      campaign.participants.push(user._id);
      await campaign.save();
   }

   return NextResponse.json({
      joined: true,
      participants: campaign.participants.length,
   });
});
