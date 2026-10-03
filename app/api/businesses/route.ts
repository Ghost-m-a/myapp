import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Business from "@/models/Business";
import Notification from "@/models/Notification";

export const MAX_BUSINESSES = 5;

export const text = (v: unknown, max: number): string =>
   String(v || "")
      .trim()
      .slice(0, max);

export const GET = route(async () => {
   const user = await getSessionUser();
   const businesses = await Business.find({ owner: user._id }).sort({
      createdAt: 1,
   });
   return NextResponse.json({ businesses });
});

export const POST = route(async (req: NextRequest) => {
   const user = await getSessionUser();
   const body = await req.json();
   const name = text(body.name, 40);
   const description = text(body.description, 200);

   if (name.length < 2)
      return fail(400, "Business name must be at least 2 characters.");
   if ((await Business.countDocuments({ owner: user._id })) >= MAX_BUSINESSES)
      return fail(403, `You can have up to ${MAX_BUSINESSES} businesses.`);

   const business = await Business.create({
      owner: user._id,
      name,
      description,
   });
   await Notification.create({
      user: user._id,
      text: `Your business "${name}" was created.`,
   });
   return NextResponse.json({ business }, { status: 201 });
});
