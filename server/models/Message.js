const mongoose = require("mongoose");
const clean = require("./_clean");
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
   {
      conversation: {
         type: ObjectId,
         ref: "Conversation",
         required: true,
         index: true,
      },
      sender: { type: ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 2000 },
      read: { type: Boolean, default: false },
   },
   { timestamps: true },
);
messageSchema.set("toJSON", clean(["conversation"]));

module.exports =
   mongoose.models.Message || mongoose.model("Message", messageSchema);
