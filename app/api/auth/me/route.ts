import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { validAvatar } from "@/app/api/auth/signup/route";

export const GET = route(async () => {
   const user = await getSessionUser();
   return NextResponse.json({ user });
});

export const PATCH = route(async (req: NextRequest) => {
   const user = await getSessionUser();
   const body = await req.json();

   if ("name" in body) {
      const name = String(body.name).trim();
      if (!name || name.length > 60)
         return fail(400, "Please enter a valid name.");
      user.name = name;
   }
   if ("avatar" in body) {
      if (body.avatar !== null && !validAvatar(body.avatar))
         return fail(400, "Invalid profile picture.");
      user.avatar = body.avatar;
   }
   if ("language" in body) {
      if (!["en", "ar"].includes(body.language))
         return fail(400, "Unsupported language.");
      user.language = body.language;
   }
   if ("theme" in body) {
      if (!["light", "dark"].includes(body.theme))
         return fail(400, "Unsupported theme.");
      user.theme = body.theme;
   }
   if ("economicIntel" in body)
      user.economicIntel = Boolean(body.economicIntel);

   await user.save();
   return NextResponse.json({ user });
});
