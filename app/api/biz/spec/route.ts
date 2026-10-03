import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import kinds from "@/lib/kinds";

export const GET = route(async () => {
   await getSessionUser();
   return NextResponse.json({ kinds });
});
