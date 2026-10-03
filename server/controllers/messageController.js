const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { pub } = require("../utils/shape");
const { fail } = require("../utils/http");

const FIELDS = "name username avatar role isSystem";

// The official account that sends the welcome message
async function ensureTeam() {
   let team = await User.findOne({ username: "team" });
   if (team) return team;
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
      return User.findOne({ username: "team" }); // created by a parallel request
   }
}
exports.ensureTeam = ensureTeam;

exports.welcome = async (user) => {
   const team = await ensureTeam();
   const text =
      "Welcome to MyApp! Explore Discover, follow people in Townhall, and invite friends from Partners.";
   const conv = await Conversation.create({
      participants: [team._id, user._id],
      startedBy: team._id,
      lastMessage: text,
      lastAt: new Date(),
   });
   await Message.create({ conversation: conv._id, sender: team._id, text });
};

function shape(conv, me, unread = 0) {
   const other = conv.participants.find((p) => !p._id.equals(me._id));
   return {
      id: conv.id,
      other: pub(other),
      lastMessage: conv.lastMessage,
      lastAt: conv.lastAt,
      unread,
      request:
         !other.isSystem &&
         !conv.startedBy.equals(me._id) &&
         !me.following.some((f) => f.equals(other._id)),
   };
}

exports.list = async (req, res) => {
   const me = req.user;
   const convs = await Conversation.find({ participants: me._id })
      .sort({ lastAt: -1 })
      .limit(100)
      .populate("participants", FIELDS);

   const counts = await Message.aggregate([
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

   const conversations = convs.map((c) => shape(c, me, byConv[c.id] || 0));
   const unread = conversations
      .filter((c) => !c.request)
      .reduce((n, c) => n + c.unread, 0);
   res.json({ conversations, unread });
};

exports.start = async (req, res) => {
   const me = req.user;
   const target = await User.findById(String(req.body.userId || ""));
   if (!target) return fail(res, 404, "User not found.");
   if (target.id === me.id)
      return fail(res, 400, "You can't message yourself.");

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
   res.status(201).json({ conversation: shape(conv, me, 0) });
};

exports.thread = async (req, res) => {
   const me = req.user;
   const conv = await Conversation.findOne({
      _id: req.params.id,
      participants: me._id,
   });
   if (!conv) return fail(res, 404, "Conversation not found.");

   await Message.updateMany(
      { conversation: conv._id, sender: { $ne: me._id }, read: false },
      { read: true },
   );
   const latest = await Message.find({ conversation: conv._id })
      .sort({ createdAt: -1 })
      .limit(100);
   res.json({ messages: latest.reverse() });
};

exports.send = async (req, res) => {
   const me = req.user;
   const text = String(req.body.text || "").trim();
   if (!text || text.length > 2000)
      return fail(res, 400, "Message must be 1 to 2000 characters.");

   const conv = await Conversation.findOne({
      _id: req.params.id,
      participants: me._id,
   });
   if (!conv) return fail(res, 404, "Conversation not found.");

   const other = await User.findById(
      conv.participants.find((p) => !p.equals(me._id)),
   );
   if (other?.isSystem)
      return fail(res, 403, "You can't reply to an official account.");

   const message = await Message.create({
      conversation: conv._id,
      sender: me._id,
      text,
   });
   conv.lastMessage = text.slice(0, 120);
   conv.lastAt = new Date();
   await conv.save();

   res.status(201).json({ message });
};
