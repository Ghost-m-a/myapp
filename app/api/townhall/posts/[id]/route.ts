import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Post from "@/models/Post";
import Comment from "@/models/Comment";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const post = await Post.findOneAndDelete({ _id: id, author: me._id });
   if (!post) return fail(404, "Post not found.");

   // Cascade BEFORE responding — serverless functions freeze after the
   // response, so unawaited cleanup could be dropped.
   await Comment.deleteMany({ post: post._id });
   return NextResponse.json({ ok: true });
});
