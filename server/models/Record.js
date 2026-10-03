const mongoose = require("mongoose");
const { ObjectId, Mixed } = mongoose.Schema.Types;

const recordSchema = new mongoose.Schema(
   {
      business: { type: ObjectId, ref: "Business", required: true },
      kind: { type: String, required: true },
      data: { type: Mixed, default: {} },
   },
   { timestamps: true, minimize: false },
);
recordSchema.index({ business: 1, kind: 1, createdAt: -1 });

// JSON shape: { id, kind, createdAt, ...fields }
recordSchema.set("toJSON", {
   virtuals: true,
   versionKey: false,
   transform: (_doc, ret) => ({
      ...ret.data,
      id: ret.id,
      kind: ret.kind,
      createdAt: ret.createdAt,
   }),
});

module.exports =
   mongoose.models.Record || mongoose.model("Record", recordSchema);
