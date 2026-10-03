const mongoose = require("mongoose");
const clean = require("./_clean");
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema(
   {
      author: { type: ObjectId, ref: "User", required: true, index: true },
      business: { type: ObjectId, ref: "Business", default: null },
      body: { type: String, required: true, maxlength: 1000 },
      title: { type: String, default: "", maxlength: 100 },
      bounty: { type: Number, default: 0, min: 0, max: 100000 },
      likes: [{ type: ObjectId, ref: "User" }],
      views: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
   },
   { timestamps: true },
);
postSchema.index({ createdAt: -1 });
postSchema.set("toJSON", clean());

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
