import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY environment variable is required");
  return new Resend(apiKey);
}

function getFromAddress(): string {
  const raw = process.env.EMAIL_FROM;
  if (!raw) return "PsicoSpace <onboarding@resend.dev>";
  // If value has no '@', treat it as a display name and append Resend's default address
  if (!raw.includes("@")) return `${raw} <onboarding@resend.dev>`;
  return raw;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://psicospace.pages.dev";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Send welcome email with e-mail verification link */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  verificationToken: string;
}) {
  const resend = getResend();
  const verifyUrl = `${getBaseUrl()}/api/auth/verify-email?token=${opts.verificationToken}`;
  const safeName = escapeHtml(opts.name);

  return resend.emails.send({
    from: getFromAddress(),
    to: opts.to,
    subject: "Bem-vindo ao PsicoSpace! Confirme seu e-mail",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#2563eb;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">Ψ PsicoSpace</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin-top:0;">Olá, ${safeName}! 👋</h2>
      <p style="color:#374151;line-height:1.6;">
        Seja bem-vindo(a) ao <strong>PsicoSpace</strong>, sua plataforma acadêmica de Psicologia.
        Para começar, precisamos confirmar o seu e-mail.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}"
           style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Confirmar e-mail
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">
        O link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        PsicoSpace · Plataforma Acadêmica de Psicologia
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

/** Resend email verification link */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verificationToken: string;
}) {
  return sendWelcomeEmail(opts); // same template, different trigger
}

/** Send password reset email */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetToken: string;
}) {
  const resend = getResend();
  const resetUrl = `${getBaseUrl()}/redefinir-senha?token=${opts.resetToken}`;
  const safeName = escapeHtml(opts.name);

  return resend.emails.send({
    from: getFromAddress(),
    to: opts.to,
    subject: "PsicoSpace — Redefinição de senha",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#2563eb;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">Ψ PsicoSpace</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin-top:0;">Olá, ${safeName}!</h2>
      <p style="color:#374151;line-height:1.6;">
        Recebemos uma solicitação para redefinir a senha da sua conta no PsicoSpace.
        Clique no botão abaixo para criar uma nova senha:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Redefinir senha
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">
        Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este e-mail.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        PsicoSpace · Plataforma Acadêmica de Psicologia
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

/** Send email notification about pending/upcoming tasks and events */
export async function sendPendingItemsEmail(opts: {
  to: string;
  name: string;
  overdueTasks: { title: string; dueDate: string }[];
  soonTasks: { title: string; dueDate: string }[];
  soonEvents: { title: string; startAt: string }[];
}) {
  const resend = getResend();
  const { overdueTasks, soonTasks, soonEvents } = opts;

  if (!overdueTasks.length && !soonTasks.length && !soonEvents.length) return;

  const safeName = escapeHtml(opts.name);

  const taskRow = (t: { title: string; dueDate: string }) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${escapeHtml(t.title)}</td>
     <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:right;">${new Date(t.dueDate).toLocaleDateString("pt-BR")}</td></tr>`;

  const eventRow = (e: { title: string; startAt: string }) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${escapeHtml(e.title)}</td>
     <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:right;">${new Date(e.startAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td></tr>`;

  const overdueSection = overdueTasks.length
    ? `<h3 style="color:#dc2626;margin:24px 0 8px;">⚠️ Tarefas Atrasadas</h3>
       <table style="width:100%;border-collapse:collapse;">${overdueTasks.map(taskRow).join("")}</table>`
    : "";

  const soonTaskSection = soonTasks.length
    ? `<h3 style="color:#d97706;margin:24px 0 8px;">📋 Tarefas Próximas (7 dias)</h3>
       <table style="width:100%;border-collapse:collapse;">${soonTasks.map(taskRow).join("")}</table>`
    : "";

  const soonEventSection = soonEvents.length
    ? `<h3 style="color:#2563eb;margin:24px 0 8px;">📅 Eventos Próximos (7 dias)</h3>
       <table style="width:100%;border-collapse:collapse;">${soonEvents.map(eventRow).join("")}</table>`
    : "";

  return resend.emails.send({
    from: getFromAddress(),
    to: opts.to,
    subject: `📋 Suas pendências no PsicoSpace`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#2563eb;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">Ψ PsicoSpace</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin-top:0;">Olá, ${safeName}!</h2>
      <p style="color:#374151;line-height:1.6;">
        Aqui está um resumo das suas pendências e eventos próximos:
      </p>
      ${overdueSection}
      ${soonTaskSection}
      ${soonEventSection}
      <div style="text-align:center;margin:32px 0;">
        <a href="${getBaseUrl()}/dashboard"
           style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Ver no PsicoSpace
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        PsicoSpace · Plataforma Acadêmica de Psicologia
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}
