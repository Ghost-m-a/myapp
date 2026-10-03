import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export const POST = route(async () => {
   const user = await getSessionUser();
   await Notification.updateMany(
      { user: user._id, read: false },
      { read: true },
   );
   return NextResponse.json({ ok: true });
});
