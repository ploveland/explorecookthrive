import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { log } from "../log";

export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const OUTBOX_DIR = path.join(process.cwd(), ".data", "mail-outbox");

export function mailerConfigured() {
  return Boolean(env("RESEND_API_KEY"));
}

export function allowResetPreview() {
  return process.env.NODE_ENV !== "production";
}

export async function sendMail(message: OutgoingMail): Promise<"sent" | "outbox"> {
  const apiKey = env("RESEND_API_KEY");
  if (apiKey) {
    const from =
      env("EMAIL_FROM") || "Explore Cook Thrive <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      log.error("mail.send_failed", { provider: "resend", status: response.status });
      throw new Error(`resend_${response.status}`);
    }
    return "sent";
  }

  if (!allowResetPreview()) {
    throw new Error("mail_unconfigured");
  }

  await mkdir(OUTBOX_DIR, { recursive: true });
  const file = path.join(OUTBOX_DIR, `${Date.now()}.json`);
  await writeFile(file, JSON.stringify(message, null, 2), "utf8");
  log.info("mail.outbox", { provider: "outbox" });
  return "outbox";
}
