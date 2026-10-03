import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export const POST = route(async () => {
   const me = await getSessionUser();
   if (!me.partnerVerified) {
      me.partnerVerified = true;
      await me.save();
      await Notification.create({
         user: me._id,
         text: "You're now a Verified Partner.",
      });
   }
   return NextResponse.json({ user: me });
});
