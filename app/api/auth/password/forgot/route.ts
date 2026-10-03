import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/http";
import connectDB from "@/lib/db";
import {
   isAuthEmailThrottled,
   sendPasswordResetEmail,
} from "@/lib/auth-tokens";
import User from "@/models/User";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const message =
   "If a verified account exists for that email, a reset link will be sent.";

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const email = String(body.email || "")
      .trim()
      .toLowerCase();
   await connectDB();

   if (EMAIL.test(email)) {
      const user = await User.findOne({ email, isSystem: { $ne: true } });
      if (
         user?.emailVerified &&
         !(await isAuthEmailThrottled(user._id, "password_reset"))
      ) {
         try {
            await sendPasswordResetEmail(user);
         } catch (err) {
            console.error("Password reset email failed:", err);
         }
      }
   }

   return NextResponse.json({ ok: true, message });
});
