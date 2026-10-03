import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { pub } from "@/lib/shape";
import User from "@/models/User";

export const GET = route(async () => {
   const me = await getSessionUser();
   const users = await User.find({
      _id: { $ne: me._id },
      isSystem: { $ne: true },
   })
      .sort({ createdAt: -1 })
      .limit(50);
   const ids = users.map((u) => u._id);

   const counts = await User.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { following: { $in: ids } } },
      { $unwind: "$following" },
      { $match: { following: { $in: ids } } },
      { $group: { _id: "$following", n: { $sum: 1 } } },
   ]);
   const followers = Object.fromEntries(
      counts.map((c) => [String(c._id), c.n]),
   );

   const list = users
      .map((u) => ({
         ...pub(u),
         followers: followers[u.id] || 0,
         following: me.following.some((f) => f.equals(u._id)),
      }))
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 8);

   return NextResponse.json({ users: list });
});
