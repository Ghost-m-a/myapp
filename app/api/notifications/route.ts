import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export const GET = route(async () => {
   const user = await getSessionUser();
   const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20);
   return NextResponse.json({ notifications });
});
