const mongoose = require("mongoose");
const clean = require("./_clean");
const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema(
   {
      post: { type: ObjectId, ref: "Post", required: true, index: true },
      author: { type: ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 500 },
   },
   { timestamps: true },
);
commentSchema.set("toJSON", clean());

module.exports =
   mongoose.models.Comment || mongoose.model("Comment", commentSchema);
