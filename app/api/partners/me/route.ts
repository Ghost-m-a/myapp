import { NextResponse } from "next/server";
import crypto from "crypto";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { pub } from "@/lib/shape";
import type { PopulatedUser } from "@/lib/townhall";
import User, { type UserDoc } from "@/models/User";
import Business, { type BusinessDoc } from "@/models/Business";

/** Lazily generates a referralCode for legacy users who don't have one yet. */
async function ensureCode(user: UserDoc): Promise<string> {
   if (!user.referralCode) {
      user.referralCode = crypto.randomBytes(4).toString("hex");
      await user.save();
   }
   return user.referralCode;
}

type BusinessWithOwnerDoc = Omit<BusinessDoc, "owner"> & {
   owner: PopulatedUser | null;
};

export const GET = route(async () => {
   const me = await getSessionUser();
   const referralCode = await ensureCode(me);

   const referred = await User.find({ referredBy: me._id })
      .sort({ createdAt: -1 })
      .limit(200);
   const businesses = (await Business.find({
      owner: { $in: referred.map((u) => u._id) },
   })
      .sort({ createdAt: -1 })
      .populate(
         "owner",
         "name username avatar role",
      )) as unknown as BusinessWithOwnerDoc[];

   return NextResponse.json({
      referralCode,
      enrolled: me.partnerVerified,
      earnings: 0, // becomes real when payments exist
      users: referred.map((u) => ({
         ...pub(u)!,
         createdAt: u.createdAt.toISOString(),
      })),
      businesses: businesses.map((b) => ({
         id: b.id,
         name: b.name,
         createdAt: b.createdAt.toISOString(),
         owner: b.owner ? pub(b.owner) : null,
      })),
   });
});
