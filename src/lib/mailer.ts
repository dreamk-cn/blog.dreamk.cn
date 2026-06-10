import { env } from "@/config/env";
import nodemailer from "nodemailer";

function getTransporter() {
  const email = env.email;
  if (!email) {
    return null;
  }

  const secure = email.port === 465;

  return nodemailer.createTransport({
    host: email.host,
    port: email.port,
    secure,
    auth: { user: email.user, pass: email.pass },
  });
}

export async function sendSmtpMail(params: { to: string; subject: string; text: string; html?: string }) {
  const email = env.email;
  const transport = getTransporter();
  if (!transport || !email) {
    return { ok: false as const, reason: "missing_smtp_config" };
  }

  const from = email.from;
  if (!from) {
    return { ok: false as const, reason: "missing_from" };
  }

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[sendSmtpMail]", err);
    return { ok: false as const, reason: "send_failed" };
  }
}
