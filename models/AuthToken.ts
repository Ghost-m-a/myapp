import mongoose, {
   Schema,
   type HydratedDocument,
   type Model,
   type Types,
} from "mongoose";

export type AuthTokenPurpose = "email_verification" | "password_reset";

export interface IAuthToken {
   user: Types.ObjectId;
   purpose: AuthTokenPurpose;
   tokenHash: string;
   expiresAt: Date;
   createdAt: Date;
}

export type AuthTokenDoc = HydratedDocument<IAuthToken>;

const authTokenSchema = new Schema<IAuthToken>(
   {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      purpose: {
         type: String,
         enum: ["email_verification", "password_reset"],
         required: true,
      },
      tokenHash: { type: String, required: true, unique: true },
      expiresAt: { type: Date, required: true },
   },
   { timestamps: { createdAt: true, updatedAt: false } },
);

authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authTokenSchema.index({ user: 1, purpose: 1, createdAt: -1 });

const AuthToken: Model<IAuthToken> =
   mongoose.models.AuthToken ||
   mongoose.model<IAuthToken>("AuthToken", authTokenSchema);

export default AuthToken;
