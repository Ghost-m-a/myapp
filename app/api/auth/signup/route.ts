import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { route, fail } from "@/lib/http";
import { ensureTeam } from "@/lib/team";
import { sendVerificationEmail } from "@/lib/auth-tokens";
import User from "@/models/User";
import Notification from "@/models/Notification";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validAvatar = (a: unknown): a is string =>
   typeof a === "string" && a.startsWith("data:image/") && a.length <= 150000;

// "John.Doe@x.com" -> "johndoe", then johndoe2, johndoe3... if taken
async function makeUsername(email: string): Promise<string> {
   const base =
      email
         .split("@")[0]
         .toLowerCase()
         .replace(/[^a-z0-9_]/g, "")
         .slice(0, 20) || "user";
   let username = base;
   let n = 1;
   while (await User.exists({ username })) username = `${base}${++n}`;
   return username;
}

export const POST = route(async (req: NextRequest) => {
   const body = await req.json();
   const name = String(body.name || "").trim();
   const email = String(body.email || "")
      .trim()
      .toLowerCase();
   const { password, role, avatar, ref } = body;

   if (!name || name.length > 60) return fail(400, "Please enter your name.");
   if (!EMAIL.test(email)) return fail(400, "Please enter a valid email.");
   if (typeof password !== "string" || password.length < 6)
      return fail(400, "Password must be at least 6 characters.");
   if (password.length > 72) return fail(400, "Password is too long.");
   if (!["advertiser", "creator"].includes(role))
      return fail(400, "Please choose a role.");
   if (avatar && !validAvatar(avatar))
      return fail(400, "Invalid profile picture.");

   await connectDB();

   if (await User.exists({ email }))
      return fail(409, "An account with this email already exists.");

   await ensureTeam(); // reserves the "team" username before anyone can take it
   const referrer = ref
      ? await User.findOne({ referralCode: String(ref) })
      : null;

   const user = await User.create({
      name,
      email,
      username: await makeUsername(email),
      passwordHash: await bcrypt.hash(password, 10),
      role,
      emailVerified: false,
      avatar: avatar || null,
      referredBy: referrer ? referrer._id : null,
      referralCode: crypto.randomBytes(4).toString("hex"),
   });

   await Notification.insertMany([
      { user: user.id, text: "Verify your email to activate your account." },
      {
         user: user.id,
         text: "Your 100 free credits will be ready after verification.",
      },
   ]);
   if (referrer) {
      await Notification.create({
         user: referrer._id,
         text: `${name} joined using your referral link.`,
      });
   }
   try {
      await sendVerificationEmail(user);
   } catch (err) {
      console.error("Signup verification email failed:", err);
      return fail(
         503,
         "Your account was created, but the verification email could not be sent. Please request another email from the login screen.",
      );
   }

   return NextResponse.json(
      { ok: true, verificationRequired: true },
      { status: 201 },
   );
});
