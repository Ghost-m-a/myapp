/**
 * Conversation shaping, ported from the legacy messageController.
 */
import type { Types } from "mongoose";
import { pub } from "@/lib/shape";
import type { ConversationDTO } from "@/lib/types";
import type { PopulatedUser } from "@/lib/townhall";
import type { UserDoc } from "@/models/User";

/** A Conversation doc after populate("participants", FIELDS). */
export interface PopulatedConversation {
   _id: Types.ObjectId;
   id: string;
   participants: PopulatedUser[];
   startedBy: Types.ObjectId;
   lastMessage: string;
   lastAt: Date;
}

export function shapeConversation(
   conv: PopulatedConversation,
   me: UserDoc,
   unread = 0,
): ConversationDTO {
   // Legacy assumed a two-party conversation; keep the same behavior.
   const other = conv.participants.find((p) => !p._id.equals(me._id))!;
   return {
      id: conv.id,
      other: pub(other),
      lastMessage: conv.lastMessage,
      lastAt: conv.lastAt.toISOString(),
      unread,
      request:
         !other.isSystem &&
         !conv.startedBy.equals(me._id) &&
         !me.following.some((f) => f.equals(other._id)),
   };
}
