import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { pub } from "@/lib/shape";
import type { CommentDTO } from "@/lib/types";
import { FIELDS, type PopulatedUser } from "@/lib/townhall";
import Post from "@/models/Post";
import Comment, { type CommentDoc } from "@/models/Comment";

type Ctx = { params: Promise<{ id: string }> };

type PopulatedComment = Omit<CommentDoc, "author"> & { author: PopulatedUser };

export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   await getSessionUser();
   const list = (await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("author", FIELDS)) as unknown as PopulatedComment[];

   const comments: CommentDTO[] = list.map((c) => ({
      id: c.id,
      author: pub(c.author),
      text: c.text,
      createdAt: c.createdAt.toISOString(),
   }));
   return NextResponse.json({ comments });
});

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const data = await req.json();
   const text = String(data.text || "").trim();
   if (!text || text.length > 500)
      return fail(400, "Comment must be 1 to 500 characters.");

   const post = await Post.findById(id);
   if (!post) return fail(404, "Post not found.");

   const c = await Comment.create({
      post: post._id,
      author: me._id,
      text,
   });
   await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });

   const comment: CommentDTO = {
      id: c.id,
      author: pub(me),
      text: c.text,
      createdAt: c.createdAt.toISOString(),
   };
   return NextResponse.json({ comment }, { status: 201 });
});
