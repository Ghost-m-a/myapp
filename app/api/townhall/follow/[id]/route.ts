import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import User from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const target = await User.findById(id);
   if (!target || target.isSystem) return fail(404, "User not found.");
   if (target.id === me.id) return fail(400, "You can't follow yourself.");

   const following = me.following.some((f) => f.equals(target._id));
   await User.updateOne(
      { _id: me._id },
      following
         ? { $pull: { following: target._id } }
         : { $addToSet: { following: target._id } },
   );
   return NextResponse.json({ following: !following });
});
