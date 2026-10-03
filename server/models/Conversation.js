const mongoose = require("mongoose");
const clean = require("./_clean");
const { ObjectId } = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema(
   {
      participants: [{ type: ObjectId, ref: "User", index: true }],
      startedBy: { type: ObjectId, ref: "User", required: true },
      lastMessage: { type: String, default: "" },
      lastAt: { type: Date, default: Date.now },
   },
   { timestamps: true },
);
conversationSchema.set("toJSON", clean());

module.exports =
   mongoose.models.Conversation ||
   mongoose.model("Conversation", conversationSchema);
