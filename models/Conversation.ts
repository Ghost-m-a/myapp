import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IConversation {
   participants: Types.ObjectId[];
   startedBy: Types.ObjectId;
   lastMessage: string;
   lastAt: Date;
   createdAt: Date;
   updatedAt: Date;
}

export type ConversationDoc = HydratedDocument<IConversation>;

const conversationSchema = new Schema<IConversation>(
   {
      participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
      startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      lastMessage: { type: String, default: "" },
      lastAt: { type: Date, default: Date.now },
   },
   { timestamps: true },
);

conversationSchema.index({ participants: 1, lastAt: -1 });
conversationSchema.set("toJSON", clean());

const Conversation: Model<IConversation> =
   mongoose.models.Conversation ||
   mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;
