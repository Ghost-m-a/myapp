import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface ICampaign {
   business: Types.ObjectId;
   title: string;
   description: string;
   category: string;
   cpm: number;
   budget: number;
   platforms: string[];
   participants: Types.ObjectId[];
   createdAt: Date;
   updatedAt: Date;
}

export type CampaignDoc = HydratedDocument<ICampaign>;

const campaignSchema = new Schema<ICampaign>(
   {
      business: {
         type: Schema.Types.ObjectId,
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
      participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
   },
   { timestamps: true },
);

campaignSchema.index({ createdAt: -1 });
campaignSchema.set("toJSON", clean());

const Campaign: Model<ICampaign> =
   mongoose.models.Campaign ||
   mongoose.model<ICampaign>("Campaign", campaignSchema);

export default Campaign;
