import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface INotification {
   user: Types.ObjectId;
   text: string;
   read: boolean;
   createdAt: Date;
   updatedAt: Date;
}

export type NotificationDoc = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      text: { type: String, required: true },
      read: { type: Boolean, default: false },
   },
   { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.set("toJSON", clean(["user"]));

const Notification: Model<INotification> =
   mongoose.models.Notification ||
   mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
