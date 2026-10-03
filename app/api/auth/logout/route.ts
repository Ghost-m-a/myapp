import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { clearAuthCookie } from "@/lib/auth";

export const POST = route(async () => {
   const res = NextResponse.json({ ok: true });
   clearAuthCookie(res);
   return res;
});
