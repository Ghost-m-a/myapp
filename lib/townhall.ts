/**
 * Townhall post shaping — the populated author/business view of a Post,
 * ported from the legacy townhallController. Also home to the shared
 * FIELDS projection used whenever a User is populated for public display.
 */
import type { Types } from "mongoose";
import { pub } from "@/lib/shape";
import type { PostDTO } from "@/lib/types";

/** Fields selected whenever a User doc is populated for public display. */
export const FIELDS = "name username avatar role isSystem";

/** A User doc after populate(path, FIELDS). */
export interface PopulatedUser {
   _id: Types.ObjectId;
   name: string;
   username: string;
   avatar: string | null;
   role: string;
   isSystem: boolean;
}

/** A Post doc after populate("author", FIELDS).populate("business", "name"). */
export interface PopulatedPost {
   _id: Types.ObjectId;
   id: string;
   author: PopulatedUser;
   business: { _id: Types.ObjectId; id: string; name: string } | null;
   title: string;
   body: string;
   bounty: number;
   createdAt: Date;
   likes: Types.ObjectId[];
   commentsCount: number;
   views: number;
}

export function shapePost(p: PopulatedPost, meId: Types.ObjectId): PostDTO {
   return {
      id: p.id,
      author: pub(p.author),
      business: p.business
         ? { id: p.business.id, name: p.business.name }
         : null,
      forum: "Public forum",
      title: p.title,
      body: p.body,
      bounty: p.bounty,
      createdAt: p.createdAt.toISOString(),
      likes: p.likes.length,
      liked: p.likes.some((l) => l.equals(meId)),
      comments: p.commentsCount,
      views: p.views,
   };
}
