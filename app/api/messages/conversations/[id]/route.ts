import { NextRequest, NextResponse } from "next/server";
import { route, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const conv = await Conversation.findOne({
      _id: id,
      participants: me._id,
   });
   if (!conv) return fail(404, "Conversation not found.");

   await Message.updateMany(
      { conversation: conv._id, sender: { $ne: me._id }, read: false },
      { read: true },
   );
   const latest = await Message.find({ conversation: conv._id })
      .sort({ createdAt: -1 })
      .limit(100);
   return NextResponse.json({ messages: latest.reverse() });
});

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
   const { id } = await ctx.params;
   const me = await getSessionUser();
   const data = await req.json();
   const text = String(data.text || "").trim();
   if (!text || text.length > 2000)
      return fail(400, "Message must be 1 to 2000 characters.");

   const conv = await Conversation.findOne({
      _id: id,
      participants: me._id,
   });
   if (!conv) return fail(404, "Conversation not found.");

   const other = await User.findById(
      conv.participants.find((p) => !p.equals(me._id)),
   );
   if (other?.isSystem)
      return fail(403, "You can't reply to an official account.");

   const message = await Message.create({
      conversation: conv._id,
      sender: me._id,
      text,
   });
   conv.lastMessage = text.slice(0, 120);
   conv.lastAt = new Date();
   await conv.save();

   return NextResponse.json({ message }, { status: 201 });
});
