const mongoose = require("mongoose");
const clean = require("./_clean");

const businessSchema = new mongoose.Schema(
   {
      owner: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },
      name: {
         type: String,
         required: true,
         trim: true,
         minlength: 2,
         maxlength: 40,
      },
      description: { type: String, default: "", maxlength: 200 },
      affiliateCommission: { type: Number, default: 30, min: 0, max: 90 },
   },
   { timestamps: true },
);

businessSchema.set("toJSON", clean());

module.exports =
   mongoose.models.Business || mongoose.model("Business", businessSchema);
