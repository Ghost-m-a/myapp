import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IComment {
   post: Types.ObjectId;
   author: Types.ObjectId;
   text: string;
   createdAt: Date;
   updatedAt: Date;
}

export type CommentDoc = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>(
   {
      post: {
         type: Schema.Types.ObjectId,
         ref: "Post",
         required: true,
         index: true,
      },
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 500 },
   },
   { timestamps: true },
);

commentSchema.set("toJSON", clean());

const Comment: Model<IComment> =
   mongoose.models.Comment ||
   mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
