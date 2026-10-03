import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/http";
import connectDB from "@/lib/db";
import { isAuthEmailThrottled, sendVerificationEmail } from "@/lib/auth-tokens";
import User from "@/models/User";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const message =
   "If an unverified account exists for that email, a verification link will be sent.";

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const email = String(body.email || "")
      .trim()
      .toLowerCase();
   await connectDB();

   if (EMAIL.test(email)) {
      const user = await User.findOne({ email, isSystem: { $ne: true } });
      if (
         user &&
         !user.emailVerified &&
         !(await isAuthEmailThrottled(user._id, "email_verification"))
      ) {
         try {
            await sendVerificationEmail(user);
         } catch (err) {
            console.error("Verification resend failed:", err);
         }
      }
   }

   return NextResponse.json({ ok: true, message });
});
