---
sidebar_position: 4
---

# Email (Resend + React Email)

## What it is

Transactional email — reset-password, verify-email, and welcome — sent through
[Resend](https://resend.com)'s SDK, with the email bodies themselves written as React components
(React Email) rather than raw HTML strings.

## Why Resend + React Email over the alternatives

Resend was picked over SES/Postmark/Sendgrid mainly for a starter template's developer
experience: a minimal SDK, a generous free tier for a new project's first users, and native
React Email support. React Email over hand-written HTML-in-template-literal emails because email
HTML has a famously hostile rendering environment (Outlook, Gmail clipping, etc.) — React Email's
components (`<Html>`, `<Section>`, `<Button>`, ...) render to table-based markup that's already
handled that, instead of a new project having to relearn 2005-era HTML email quirks.

## The one file allowed to import Resend

```tsx title="backend/src/services/email.tsx"
/**
 * This is the ONLY file in the app allowed to import the Resend SDK.
 * Everything else should call `sendEmail()`.
 */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface TemplateDataMap {
  "reset-password": { url: string; name?: string };
  "verify-email": { url: string; name?: string };
  welcome: { name?: string; loginUrl?: string };
}

export async function sendEmail<T extends EmailTemplate>({
  to,
  template,
  data,
}: SendEmailArgs<T>): Promise<SendEmailResult> {
  const { subject, element } = buildEmail(template, data);

  if (!resend) {
    logger.info({ template, to, subject }, "RESEND_API_KEY not set; skipping real send");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const { data: result, error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? DEFAULT_FROM,
    to,
    subject,
    react: element,
  });

  if (error) throw new Error(`Failed to send "${template}" email to ${to}: ${error.message}`);
  return { sent: true, id: result!.id };
}
```

This is the [service-wrapper pattern](/patterns) applied to email: every call site imports
`sendEmail()` from this one file, never the Resend SDK directly, and the template name is a
typed union (`TemplateDataMap`) so calling `sendEmail({ template: "welcome", data: { url: ... } })`
— the wrong shape for that template — is a compile error, not a runtime surprise.

## Lazy, credential-gated, never blocks the app

Without `RESEND_API_KEY` set, `sendEmail()` logs the attempt and returns
`{ sent: false, reason: ... }` instead of throwing. This is why registration, password reset, and
welcome emails all work end-to-end in local dev with zero email configuration — you just don't
get a real email, and the exact content (including the reset/verify URL) is visible in the
backend's log output instead.

## Adding a new template

1. Add a React Email component under `backend/src/emails/`.
2. Add its entry to `TemplateDataMap` in `email.tsx` with the exact props it needs.
3. Add a `case` to `buildEmail()`'s switch — the `_exhaustive: never` fallback means forgetting
   this step is a TypeScript error, not a silent runtime bug.
4. Call `sendEmail({ to, template: "your-template", data: { ... } })` from wherever it's
   triggered.
