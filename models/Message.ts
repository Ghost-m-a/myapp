import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IMessage {
   conversation: Types.ObjectId;
   sender: Types.ObjectId;
   text: string;
   read: boolean;
   createdAt: Date;
   updatedAt: Date;
}

export type MessageDoc = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage>(
   {
      conversation: {
         type: Schema.Types.ObjectId,
         ref: "Conversation",
         required: true,
      },
      sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, maxlength: 2000 },
      read: { type: Boolean, default: false },
   },
   { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ conversation: 1, sender: 1, read: 1 });
messageSchema.set("toJSON", clean(["conversation"]));

const Message: Model<IMessage> =
   mongoose.models.Message ||
   mongoose.model<IMessage>("Message", messageSchema);

export default Message;
