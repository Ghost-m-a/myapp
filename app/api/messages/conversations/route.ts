import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { FIELDS } from "@/lib/townhall";
import {
   shapeConversation,
   type PopulatedConversation,
} from "@/lib/messages";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export const GET = route(async () => {
   const me = await getSessionUser();
   const convs = (await Conversation.find({ participants: me._id })
      .sort({ lastAt: -1 })
      .limit(100)
      .populate("participants", FIELDS)) as unknown as PopulatedConversation[];

   const counts = await Message.aggregate<{ _id: Types.ObjectId; n: number }>([
      {
         $match: {
            conversation: { $in: convs.map((c) => c._id) },
            sender: { $ne: me._id },
            read: false,
         },
      },
      { $group: { _id: "$conversation", n: { $sum: 1 } } },
   ]);
   const byConv = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

   const conversations = convs.map((c) =>
      shapeConversation(c, me, byConv[c.id] || 0),
   );
   const unread = conversations
      .filter((c) => !c.request)
      .reduce((n, c) => n + c.unread, 0);
   return NextResponse.json({ conversations, unread });
});

export const POST = route(async (req: NextRequest) => {
   const me = await getSessionUser();
   const data = await req.json();
   const target = await User.findById(String(data.userId || ""));
   if (!target) return fail(404, "User not found.");
   if (target.id === me.id)
      return fail(400, "You can't message yourself.");

   let conv = await Conversation.findOne({
      participants: { $all: [me._id, target._id] },
   });
   if (!conv) {
      conv = await Conversation.create({
         participants: [me._id, target._id],
         startedBy: me._id,
         lastAt: new Date(),
      });
   }
   await conv.populate("participants", FIELDS);
   return NextResponse.json(
      {
         conversation: shapeConversation(
            conv as unknown as PopulatedConversation,
            me,
            0,
         ),
      },
      { status: 201 },
   );
});
