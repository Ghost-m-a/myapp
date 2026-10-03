import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";

export type RecordData = Record<string, unknown>;

export interface IRecord {
   business: Types.ObjectId;
   kind: string;
   data: RecordData;
   createdAt: Date;
   updatedAt: Date;
}

export type RecordDoc = HydratedDocument<IRecord>;

const recordSchema = new Schema<IRecord>(
   {
      business: {
         type: Schema.Types.ObjectId,
         ref: "Business",
         required: true,
      },
      kind: { type: String, required: true },
      data: { type: Schema.Types.Mixed, default: {} },
   },
   { timestamps: true, minimize: false },
);

recordSchema.index({ business: 1, kind: 1, createdAt: -1 });

// JSON shape: { ...data fields, id, kind, createdAt }
recordSchema.set("toJSON", {
   virtuals: true,
   versionKey: false,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   transform: (_doc: unknown, ret: any) => ({
      ...(ret.data as RecordData),
      id: ret.id as string,
      kind: ret.kind as string,
      createdAt: ret.createdAt as Date,
   }),
});

const RecordModel: Model<IRecord> =
   mongoose.models.Record || mongoose.model<IRecord>("Record", recordSchema);

export default RecordModel;
