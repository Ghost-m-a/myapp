import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { ApiError } from "@/lib/http";
import User, { type UserDoc } from "@/models/User";

const COOKIE = "token";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

function secret(): string {
   const s = process.env.JWT_SECRET;
   if (!s) throw new Error("JWT_SECRET is missing. Check your .env file.");
   return s;
}

export function signToken(id: string, remember: boolean): string {
   return jwt.sign({ id }, secret(), { expiresIn: remember ? "30d" : "1d" });
}

export function setAuthCookie(
   res: NextResponse,
   token: string,
   remember: boolean,
): void {
   res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remember ? { maxAge: THIRTY_DAYS } : {}),
   });
}

export function clearAuthCookie(res: NextResponse): void {
   res.cookies.set(COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
   });
}

/**
 * Loads the authenticated user from the `token` cookie.
 * Throws ApiError(401) with the same messages the Express middleware used.
 */
export async function getSessionUser(): Promise<UserDoc> {
   const store = await cookies();
   const token = store.get(COOKIE)?.value;
   if (!token) throw new ApiError(401, "Not logged in.");

   let id: string;
   try {
      id = (jwt.verify(token, secret()) as { id: string }).id;
   } catch {
      throw new ApiError(401, "Session expired. Please log in again.");
   }

   await connectDB();
   const user = await User.findById(id);
   if (!user) throw new ApiError(401, "Account not found.");
   return user;
}
