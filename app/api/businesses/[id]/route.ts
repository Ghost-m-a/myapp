import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Business from "@/models/Business";
import Campaign from "@/models/Campaign";
import RecordModel from "@/models/Record";
import { text } from "@/app/api/businesses/route";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const user = await getSessionUser();
   const business = await Business.findOne({ _id: id, owner: user._id });
   if (!business) return fail(404, "Business not found.");

   const body = await req.json();
   if ("name" in body) {
      const name = text(body.name, 40);
      if (name.length < 2)
         return fail(400, "Business name must be at least 2 characters.");
      business.name = name;
   }
   if ("description" in body)
      business.description = text(body.description, 200);
   if ("affiliateCommission" in body) {
      const n = Number(body.affiliateCommission);
      if (!Number.isFinite(n) || n < 0 || n > 90)
         return fail(400, "Commission must be between 0 and 90.");
      business.affiliateCommission = n;
   }

   await business.save();
   return NextResponse.json({ business });
});

export const DELETE = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const user = await getSessionUser();
   const business = await Business.findOneAndDelete({
      _id: id,
      owner: user._id,
   });
   if (!business) return fail(404, "Business not found.");

   // Cascade BEFORE responding — serverless functions freeze after the
   // response, so the legacy fire-and-forget cleanup could be dropped.
   await Promise.all([
      RecordModel.deleteMany({ business: business._id }),
      Campaign.deleteMany({ business: business._id }),
   ]);
   return NextResponse.json({ ok: true });
});
