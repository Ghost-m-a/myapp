import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { route, fail } from "@/lib/http";
import connectDB from "@/lib/db";
import { consumeAuthToken, isAuthTokenValid } from "@/lib/auth-tokens";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";

export const GET = route(async (req: NextRequest) => {
   await connectDB();
   const token = req.nextUrl.searchParams.get("token") || "";
   const valid = await isAuthTokenValid(token, "password_reset");
   return NextResponse.json(
      { valid },
      { headers: { "Cache-Control": "no-store" } },
   );
});

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const token = String(body.token || "");
   const password = body.password;
   if (
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 72
   )
      return fail(400, "Password must be 6 to 72 characters.");

   await connectDB();
   const authToken = await consumeAuthToken(token, "password_reset");
   if (!authToken) return fail(400, "Reset link is invalid or expired.");
   const user = await User.findById(authToken.user);
   if (!user) return fail(400, "Reset link is invalid or expired.");

   user.passwordHash = await bcrypt.hash(password, 10);
   await user.save();
   await AuthToken.deleteMany({ user: user._id, purpose: "password_reset" });
   return NextResponse.json({ ok: true });
});
