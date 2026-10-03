import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
   if (transporter) return transporter;

   const user = process.env.BREVO_SMTP_USER;
   const pass = process.env.BREVO_SMTP_KEY;
   const from = process.env.BREVO_SENDER_EMAIL;
   if (!user || !pass || !from) {
      throw new Error("Brevo SMTP is not configured.");
   }

   const port = Number(process.env.BREVO_SMTP_PORT || 587);
   transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
      port,
      secure: port === 465,
      auth: { user, pass },
   });
   return transporter;
}

export async function sendAppEmail({
   to,
   subject,
   text,
   html,
}: {
   to: string;
   subject: string;
   text: string;
   html: string;
}): Promise<void> {
   const fromEmail = process.env.BREVO_SENDER_EMAIL;
   if (!fromEmail) throw new Error("Brevo sender email is not configured.");

   await getTransporter().sendMail({
      from: `${process.env.BREVO_SENDER_NAME || "MyApp"} <${fromEmail}>`,
      to,
      subject,
      text,
      html,
   });
}
