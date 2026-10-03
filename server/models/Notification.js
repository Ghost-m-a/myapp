const mongoose = require("mongoose");
const clean = require("./_clean");

const notificationSchema = new mongoose.Schema(
   {
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },
      text: { type: String, required: true },
      read: { type: Boolean, default: false },
   },
   { timestamps: true },
);

notificationSchema.set("toJSON", clean(["user"]));

module.exports =
   mongoose.models.Notification ||
   mongoose.model("Notification", notificationSchema);
