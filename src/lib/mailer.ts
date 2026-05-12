import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.EMAIL_HOST?.trim();
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.EMAIL_PORT || "465");
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendSmtpMail(params: { to: string; subject: string; text: string }) {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false as const, reason: "missing_smtp_config" };
  }

  const from = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim();
  if (!from) {
    return { ok: false as const, reason: "missing_from" };
  }

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[sendSmtpMail]", err);
    return { ok: false as const, reason: "send_failed" };
  }
}
