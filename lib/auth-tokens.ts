import { createHash, randomBytes } from "crypto";
import type { Types } from "mongoose";
import AuthToken, { type AuthTokenPurpose } from "@/models/AuthToken";
import type { UserDoc } from "@/models/User";
import { sendAppEmail } from "@/lib/mailer";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function hashToken(token: string): string {
   return createHash("sha256").update(token).digest("hex");
}

function appUrl(path: string, token: string): string {
   const base = (process.env.APP_URL || "http://localhost:3000").replace(
      /\/+$/,
      "",
   );
   return `${base}/${path}?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
   return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
         "&": "&amp;",
         "<": "&lt;",
         ">": "&gt;",
         '"': "&quot;",
         "'": "&#39;",
      };
      return entities[character];
   });
}

export async function issueAuthToken(
   userId: Types.ObjectId,
   purpose: AuthTokenPurpose,
   lifetimeMs: number,
): Promise<string> {
   await AuthToken.deleteMany({ user: userId, purpose });
   const token = randomBytes(32).toString("hex");
   await AuthToken.create({
      user: userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + lifetimeMs),
   });
   return token;
}

export async function consumeAuthToken(
   token: string,
   purpose: AuthTokenPurpose,
) {
   if (!TOKEN_PATTERN.test(token)) return null;
   return AuthToken.findOneAndDelete({
      tokenHash: hashToken(token),
      purpose,
      expiresAt: { $gt: new Date() },
   });
}

export async function isAuthTokenValid(
   token: string,
   purpose: AuthTokenPurpose,
): Promise<boolean> {
   if (!TOKEN_PATTERN.test(token)) return false;
   return Boolean(
      await AuthToken.exists({
         tokenHash: hashToken(token),
         purpose,
         expiresAt: { $gt: new Date() },
      }),
   );
}

export async function isAuthEmailThrottled(
   userId: Types.ObjectId,
   purpose: AuthTokenPurpose,
): Promise<boolean> {
   const recent = await AuthToken.exists({
      user: userId,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 60_000) },
   });
   return Boolean(recent);
}

export async function sendVerificationEmail(user: UserDoc): Promise<void> {
   const token = await issueAuthToken(
      user._id,
      "email_verification",
      24 * 60 * 60 * 1000,
   );
   const url = appUrl("verify-email", token);
   const name = escapeHtml(user.name);
   await sendAppEmail({
      to: user.email,
      subject: "Verify your MyApp email",
      text: `Hi ${user.name}, verify your email within 24 hours: ${url}`,
      html: `<p>Hi ${name},</p><p>Verify your email within 24 hours to activate your MyApp account.</p><p><a href="${url}">Verify email</a></p><p>If you did not create this account, you can ignore this message.</p>`,
   });
}

export async function sendPasswordResetEmail(user: UserDoc): Promise<void> {
   const token = await issueAuthToken(
      user._id,
      "password_reset",
      30 * 60 * 1000,
   );
   const url = appUrl("reset-password", token);
   const name = escapeHtml(user.name);
   await sendAppEmail({
      to: user.email,
      subject: "Reset your MyApp password",
      text: `Hi ${user.name}, reset your password within 30 minutes: ${url}`,
      html: `<p>Hi ${name},</p><p>Use the link below within 30 minutes to choose a new password.</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can ignore this message.</p>`,
   });
}
