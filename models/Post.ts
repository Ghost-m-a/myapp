import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IPost {
   author: Types.ObjectId;
   business: Types.ObjectId | null;
   body: string;
   title: string;
   bounty: number;
   likes: Types.ObjectId[];
   views: number;
   commentsCount: number;
   createdAt: Date;
   updatedAt: Date;
}

export type PostDoc = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
   {
      author: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },
      business: {
         type: Schema.Types.ObjectId,
         ref: "Business",
         default: null,
      },
      body: { type: String, required: true, maxlength: 1000 },
      title: { type: String, default: "", maxlength: 100 },
      bounty: { type: Number, default: 0, min: 0, max: 100000 },
      likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
      views: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
   },
   { timestamps: true },
);

postSchema.index({ createdAt: -1 });
postSchema.set("toJSON", clean());

const Post: Model<IPost> =
   mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default Post;
