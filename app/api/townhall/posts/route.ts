import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { FIELDS, shapePost, type PopulatedPost } from "@/lib/townhall";
import Post, { type IPost } from "@/models/Post";
import Business from "@/models/Business";

export const GET = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const query: QueryFilter<IPost> = {};
   const filter = req.nextUrl.searchParams.get("filter");
   if (filter === "following")
      query.author = { $in: [...me.following, me._id] };
   if (filter === "mine") query.author = me._id;

   const posts = (await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("author", FIELDS)
      .populate("business", "name")) as unknown as PopulatedPost[];

   // Legacy fired this without awaiting; serverless drops unawaited work,
   // so await it — but keep it after the find.
   await Post.updateMany(
      { _id: { $in: posts.map((p) => p._id) } },
      { $inc: { views: 1 } },
   );

   return NextResponse.json({
      posts: posts.map((p) => shapePost(p, me._id)),
   });
});

export const POST = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const data = await req.json();
   const body = String(data.body || "").trim();
   if (!body || body.length > 1000)
      return fail(400, "Post must be 1 to 1000 characters.");

   let business = null;
   if (data.businessId) {
      business = await Business.findOne({
         _id: data.businessId,
         owner: me._id,
      });
      if (!business) return fail(400, "Business not found.");
   }

   const bounty = Math.max(0, Math.min(100000, Number(data.bounty) || 0));
   const post = await Post.create({
      author: me._id,
      business: business?._id || null,
      body,
      title: String(data.title || "")
         .trim()
         .slice(0, 100),
      bounty,
   });

   const full = (await Post.findById(post._id)
      .populate("author", FIELDS)
      .populate("business", "name")) as unknown as PopulatedPost;
   return NextResponse.json({ post: shapePost(full, me._id) }, { status: 201 });
});
