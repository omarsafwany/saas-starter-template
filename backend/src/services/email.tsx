import type { ReactElement } from "react";

import { Resend } from "resend";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ResetPasswordEmail } from "../emails/reset-password.js";
import { VerifyEmail } from "../emails/verify-email.js";
import { WelcomeEmail } from "../emails/welcome.js";

/**
 * This is the ONLY file in the app allowed to import the Resend SDK.
 * Everything else should call `sendEmail()`.
 */

const DEFAULT_FROM = "SaaS Starter <onboarding@resend.dev>";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface TemplateDataMap {
  "reset-password": { url: string; name?: string };
  "verify-email": { url: string; name?: string };
  welcome: { name?: string; loginUrl?: string };
}

export type EmailTemplate = keyof TemplateDataMap;

interface SendEmailArgs<T extends EmailTemplate> {
  to: string;
  template: T;
  data: TemplateDataMap[T];
}

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

function buildEmail<T extends EmailTemplate>(
  template: T,
  data: TemplateDataMap[T],
): { subject: string; element: ReactElement } {
  switch (template) {
    case "reset-password": {
      const d = data as TemplateDataMap["reset-password"];
      return {
        subject: "Reset your password",
        element: <ResetPasswordEmail url={d.url} name={d.name} />,
      };
    }
    case "verify-email": {
      const d = data as TemplateDataMap["verify-email"];
      return {
        subject: "Verify your email address",
        element: <VerifyEmail url={d.url} name={d.name} />,
      };
    }
    case "welcome": {
      const d = data as TemplateDataMap["welcome"];
      return {
        subject: "Welcome aboard",
        element: <WelcomeEmail name={d.name} loginUrl={d.loginUrl} />,
      };
    }
    default: {
      const _exhaustive: never = template;
      throw new Error(`Unknown email template: ${String(_exhaustive)}`);
    }
  }
}

export async function sendEmail<T extends EmailTemplate>({
  to,
  template,
  data,
}: SendEmailArgs<T>): Promise<SendEmailResult> {
  const { subject, element } = buildEmail(template, data);

  if (!resend) {
    const url =
      "url" in data && typeof (data as { url?: string }).url === "string"
        ? (data as { url: string }).url
        : undefined;
    logger.info(
      { template, to, subject, url },
      "RESEND_API_KEY not set; skipping real send",
    );
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const { data: result, error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? DEFAULT_FROM,
    to,
    subject,
    react: element,
  });

  if (error) {
    throw new Error(
      `Failed to send "${template}" email to ${to}: ${error.message}`,
    );
  }

  return { sent: true, id: result!.id };
}
