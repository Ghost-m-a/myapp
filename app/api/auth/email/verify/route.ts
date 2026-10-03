import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import connectDB from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { welcome } from "@/lib/team";
import User from "@/models/User";

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const token = String(body.token || "");
   if (!token) return fail(400, "Verification link is invalid or expired.");

   await connectDB();
   const authToken = await consumeAuthToken(token, "email_verification");
   if (!authToken) return fail(400, "Verification link is invalid or expired.");

   const user = await User.findById(authToken.user);
   if (!user) return fail(400, "Verification link is invalid or expired.");
   user.emailVerified = true;
   user.emailVerifiedAt = new Date();
   await user.save();
   await welcome(user).catch((err: unknown) =>
      console.error("Verified-account welcome message failed:", err),
   );

   return NextResponse.json({ ok: true, verified: true });
});
