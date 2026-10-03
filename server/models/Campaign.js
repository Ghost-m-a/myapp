const mongoose = require("mongoose");
const clean = require("./_clean");
const { ObjectId } = mongoose.Schema.Types;

const campaignSchema = new mongoose.Schema(
   {
      business: {
         type: ObjectId,
         ref: "Business",
         required: true,
         index: true,
      },
      title: { type: String, required: true, trim: true, maxlength: 80 },
      description: { type: String, default: "", maxlength: 500 },
      category: { type: String, default: "other" },
      cpm: { type: Number, required: true },
      budget: { type: Number, required: true },
      platforms: [{ type: String }],
      participants: [{ type: ObjectId, ref: "User" }],
   },
   { timestamps: true },
);
campaignSchema.index({ createdAt: -1 });
campaignSchema.set("toJSON", clean());

module.exports =
   mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
