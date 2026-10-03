import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import { route, fail } from "@/lib/http";
import { signToken, setAuthCookie } from "@/lib/auth";
import User from "@/models/User";

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const id = String(body.identifier || "")
      .trim()
      .toLowerCase();
   const password = String(body.password || "");

   await connectDB();
   const user = await User.findOne({ $or: [{ email: id }, { username: id }] });
   const ok =
      user &&
      !user.isSystem &&
      (await bcrypt.compare(password, user.passwordHash));
   if (!ok || !user)
      return fail(401, "Wrong email/username or password.");

   const remember = body.remember !== false;
   const res = NextResponse.json({ user });
   setAuthCookie(res, signToken(user.id, remember), remember);
   return res;
});
