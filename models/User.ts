import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";
import clean from "./clean";

export interface IUser {
   name: string;
   email: string;
   username: string;
   passwordHash: string;
   role: "advertiser" | "creator";
   avatar: string | null;
   credits: number;
   language: "en" | "ar";
   theme?: "light" | "dark";
   following: Types.ObjectId[];
   referralCode?: string;
   referredBy: Types.ObjectId | null;
   partnerVerified: boolean;
   economicIntel: boolean;
   isSystem: boolean;
   createdAt: Date;
   updatedAt: Date;
}

export type UserDoc = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
   {
      name: { type: String, required: true, trim: true, maxlength: 60 },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      username: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["advertiser", "creator"], required: true },
      avatar: { type: String, default: null },
      credits: { type: Number, default: 100 },
      language: { type: String, enum: ["en", "ar"], default: "en" },
      theme: { type: String, enum: ["light", "dark"] },

      following: [{ type: Schema.Types.ObjectId, ref: "User" }],
      referralCode: { type: String, unique: true, sparse: true },
      referredBy: {
         type: Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
      partnerVerified: { type: Boolean, default: false },
      economicIntel: { type: Boolean, default: false },
      isSystem: { type: Boolean, default: false },
   },
   { timestamps: true },
);

userSchema.set("toJSON", clean(["passwordHash", "following", "referredBy"]));

const User: Model<IUser> =
   mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
