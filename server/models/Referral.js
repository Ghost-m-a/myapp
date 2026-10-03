const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
   {
      partner: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
      volume: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
   },
   { timestamps: true },
);

module.exports =
   mongoose.models.Referral || mongoose.model("Referral", referralSchema);
