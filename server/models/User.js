const mongoose = require("mongoose");
const clean = require("./_clean");

const userSchema = new mongoose.Schema(
   {
      name: { type: String, required: true, trim: true, maxlength: 60 },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      username: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["advertiser", "creator"], required: true },
      avatar: { type: String, default: null },
      credits: { type: Number, default: 100 },
      language: { type: String, enum: ["en", "ar"], default: "en" },
      theme: { type: String, enum: ["light", "dark"] },

      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      referralCode: { type: String, unique: true, sparse: true },
      referredBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
      partnerVerified: { type: Boolean, default: false },
      economicIntel: { type: Boolean, default: false },
      isSystem: { type: Boolean, default: false },
   },
   { timestamps: true },
);

userSchema.set("toJSON", clean(["passwordHash", "following", "referredBy"]));

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
