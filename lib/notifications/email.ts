import type { NotificationType, UserRole } from "@/types/domain";
import { logEvent } from "@/lib/observability/logger";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult =
  | { ok: true; provider: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; reason: string };

function getEmailConfig() {
  return {
    provider: process.env.EMAIL_PROVIDER?.trim().toLowerCase() ?? "",
    from: process.env.EMAIL_FROM_ADDRESS?.trim() ?? "",
    replyTo: process.env.EMAIL_REPLY_TO?.trim() ?? "",
    resendKey: process.env.RESEND_API_KEY?.trim() ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000"
  };
}

function getRoleLabel(role: UserRole) {
  if (role === "student") return "Student";
  if (role === "teacher") return "Teacher";
  if (role === "parent") return "Parent";
  return "Admin";
}

function getNotificationLabel(type: NotificationType) {
  return type.replaceAll("_", " ");
}

export function renderNotificationEmail({
  role,
  type,
  title,
  body,
  actionHref
}: {
  role: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  actionHref: string | null;
}) {
  const { siteUrl } = getEmailConfig();
  const resolvedHref = actionHref ? `${siteUrl}${actionHref}` : siteUrl;
  const eyebrow = `${getRoleLabel(role)} reminder`;
  const footer = "Universal Learner keeps classroom progress, due dates, and next actions in one place.";

  const text = `${eyebrow}\n\n${title}\n\n${body}\n\nOpen: ${resolvedHref}\n\n${footer}`;
  const html = `
    <div style="background:#f4f8fc;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:24px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);padding:28px 32px;color:#ffffff;">
          <p style="margin:0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#dbeafe;font-weight:700;">${eyebrow}</p>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:700;">${title}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:14px;text-transform:uppercase;letter-spacing:0.18em;color:#1d4ed8;font-weight:700;">${getNotificationLabel(type)}</p>
          <p style="margin:0;font-size:16px;line-height:1.8;color:#334155;">${body}</p>
          <a href="${resolvedHref}" style="display:inline-block;margin-top:24px;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;">
            Open Universal Learner
          </a>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:13px;line-height:1.7;">
          ${footer}
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

export async function sendNotificationEmail(message: EmailMessage): Promise<EmailSendResult> {
  const config = getEmailConfig();

  if (!config.provider) {
    logEvent("warn", "notifications.email", "Skipping email delivery because no provider is configured.");
    return { ok: false, skipped: true, reason: "No email provider is configured." };
  }

  if (config.provider !== "resend") {
    logEvent("warn", "notifications.email", "Skipping email delivery because the provider is unsupported.", {
      provider: config.provider
    });
    return { ok: false, skipped: true, reason: `Unsupported email provider: ${config.provider}.` };
  }

  if (!config.resendKey || !config.from) {
    logEvent("warn", "notifications.email", "Skipping email delivery because Resend is missing required configuration.");
    return { ok: false, skipped: true, reason: "EMAIL_FROM_ADDRESS and RESEND_API_KEY are required for Resend delivery." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      reply_to: config.replyTo || undefined,
      subject: message.subject,
      text: message.text,
      html: message.html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    logEvent("error", "notifications.email", "Email delivery request failed.", {
      status: response.status,
      body
    });
    return {
      ok: false,
      reason: body || `Email delivery failed with HTTP ${response.status}.`
    };
  }

  logEvent("info", "notifications.email", "Email delivered through provider.", {
    provider: "resend",
    to: message.to
  });
  return { ok: true, provider: "resend" };
}
