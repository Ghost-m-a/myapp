import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";

export const POST = route(async (req: NextRequest) => {
   const user = await getSessionUser();
   const { current, next } = await req.json();

   if (!(await bcrypt.compare(String(current || ""), user.passwordHash)))
      return fail(400, "Current password is incorrect.");
   if (typeof next !== "string" || next.length < 6 || next.length > 72)
      return fail(400, "New password must be 6 to 72 characters.");

   user.passwordHash = await bcrypt.hash(next, 10);
   await user.save();
   return NextResponse.json({ ok: true });
});
