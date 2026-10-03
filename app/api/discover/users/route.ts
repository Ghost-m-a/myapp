import { NextRequest, NextResponse } from "next/server";
import { route, escapeRegex } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { pub } from "@/lib/shape";
import User from "@/models/User";

// Used by "New message" to find people
export const GET = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const q = String(req.nextUrl.searchParams.get("q") || "")
      .trim()
      .slice(0, 40);
   const role = req.nextUrl.searchParams.get("role");
   if (q.length < 2) return NextResponse.json({ users: [] });

   const rx = { $regex: escapeRegex(q), $options: "i" };
   const users = await User.find({
      _id: { $ne: me._id },
      isSystem: { $ne: true },
      ...(role === "creator" || role === "advertiser" ? { role } : {}),
      $or: [{ name: rx }, { username: rx }],
   }).limit(8);

   return NextResponse.json({ users: users.map(pub) });
});
