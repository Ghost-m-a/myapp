import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import Post from "@/models/Post";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const post = await Post.findById(id);
   if (!post) return fail(404, "Post not found.");

   const liked = post.likes.some((l) => l.equals(me._id));
   await Post.updateOne(
      { _id: post._id },
      liked ? { $pull: { likes: me._id } } : { $addToSet: { likes: me._id } },
   );
   return NextResponse.json({
      liked: !liked,
      likes: post.likes.length + (liked ? -1 : 1),
   });
});
