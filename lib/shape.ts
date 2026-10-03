import type { Types } from "mongoose";

export interface PubUser {
   id: string;
   name: string;
   username: string;
   avatar: string | null;
   role: string;
   isSystem: boolean;
}

interface UserLike {
   id?: string;
   _id?: Types.ObjectId;
   name: string;
   username: string;
   avatar?: string | null;
   role: string;
   isSystem?: boolean;
}

/** Only the fields that are safe to show to other users. */
export function pub(u: UserLike | null | undefined): PubUser | null {
   if (!u) return null;
   return {
      id: String(u.id ?? u._id),
      name: u.name,
      username: u.username,
      avatar: u.avatar ?? null,
      role: u.role,
      isSystem: Boolean(u.isSystem),
   };
}
