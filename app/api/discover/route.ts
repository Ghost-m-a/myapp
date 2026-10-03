import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { route, escapeRegex } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { pub } from "@/lib/shape";
import type { PopulatedUser } from "@/lib/townhall";
import User from "@/models/User";
import Business, { type BusinessDoc, type IBusiness } from "@/models/Business";

type BusinessWithOwnerDoc = Omit<BusinessDoc, "owner"> & {
   owner: PopulatedUser | null;
};

export const GET = route(async (req: NextRequest) => {
   await getSessionUser();
   const q = String(req.nextUrl.searchParams.get("q") || "")
      .trim()
      .slice(0, 40);
   const filter: QueryFilter<IBusiness> = q
      ? { name: { $regex: escapeRegex(q), $options: "i" } }
      : {};

   const [users, businessCount, businesses] = await Promise.all([
      User.countDocuments({ isSystem: { $ne: true } }),
      Business.countDocuments(),
      Business.find(filter)
         .sort({ createdAt: -1 })
         .limit(24)
         .populate("owner", "name username avatar role"),
   ]);

   return NextResponse.json({
      stats: { users, businesses: businessCount, earned: 0 },
      businesses: (businesses as unknown as BusinessWithOwnerDoc[]).map(
         (b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            createdAt: b.createdAt.toISOString(),
            owner: b.owner ? pub(b.owner) : null,
         }),
      ),
   });
});
