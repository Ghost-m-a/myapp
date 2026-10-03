import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IBusiness {
   owner: Types.ObjectId;
   name: string;
   description: string;
   affiliateCommission: number;
   createdAt: Date;
   updatedAt: Date;
}

export type BusinessDoc = HydratedDocument<IBusiness>;

const businessSchema = new Schema<IBusiness>(
   {
      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },
      name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
      description: { type: String, default: "", maxlength: 200 },
      affiliateCommission: { type: Number, default: 30, min: 0, max: 90 },
   },
   { timestamps: true },
);

businessSchema.set("toJSON", clean());

const Business: Model<IBusiness> =
   mongoose.models.Business ||
   mongoose.model<IBusiness>("Business", businessSchema);

export default Business;
