import bcrypt from "bcryptjs";
import crypto from "crypto";
import User, { type UserDoc } from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

/** The official account that sends the welcome message. */
export async function ensureTeam(): Promise<UserDoc | null> {
   const existing = await User.findOne({ username: "team" });
   if (existing) return existing;
   try {
      return await User.create({
         name: "Team MyApp",
         email: "team@myapp.local",
         username: "team",
         passwordHash: await bcrypt.hash(
            crypto.randomBytes(16).toString("hex"),
            10,
         ),
         role: "creator",
         isSystem: true,
      });
   } catch {
      // created by a parallel request
      return User.findOne({ username: "team" });
   }
}

export async function welcome(user: UserDoc): Promise<void> {
   const team = await ensureTeam();
   if (!team) return;
   const text =
      "Welcome to MyApp! Explore Discover, follow people in Townhall, and invite friends from Partners.";
   const conv = await Conversation.create({
      participants: [team._id, user._id],
      startedBy: team._id,
      lastMessage: text,
      lastAt: new Date(),
   });
   await Message.create({ conversation: conv._id, sender: team._id, text });
}
