/**
 * Mailer Service
 * Handles email sending operations using Resend
 */

import 'server-only';
import { Resend } from 'resend';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export class MailerService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@wellifyglobal.com';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Send email with attachments using Resend
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key is not configured. Please set RESEND_API_KEY in environment variables.');
    }

    try {
      const emailData: any = {
        from: `WELLIFY Business <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
      };

      if (options.html) {
        emailData.html = options.html;
      }

      if (options.text) {
        emailData.text = options.text;
      }

      if (options.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType || 'application/octet-stream',
        }));
      }

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('[MailerService] Resend error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('[MailerService] Email sent successfully:', {
        to: options.to,
        subject: options.subject,
        id: data?.id,
      });
    } catch (error: any) {
      console.error('[MailerService] Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Send email verification code
   * @param email - Email address to send code to
   * @param code - 6-digit verification code
   * @param language - Language code ('ru', 'uk', 'en'), defaults to 'uk'
   */
  async sendVerificationCode(email: string, code: string, language: 'ru' | 'uk' | 'en' = 'uk'): Promise<void> {
    // Определяем язык для HTML атрибута
    const htmlLang = language === 'uk' ? 'uk' : language === 'ru' ? 'ru' : 'en';
    
    // Тексты для разных языков
    const texts = {
      ru: {
        title: 'Код подтверждения email | WELLIFY business',
        heading: 'Подтверждение email',
        paragraph1: 'Вы начали регистрацию в системе управления сменами',
        paragraph2: 'Введите код подтверждения ниже для завершения регистрации.',
        codeLabel: 'Ваш код подтверждения:',
        codeValid: 'Код действителен в течение 15 минут.',
        footer: 'Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.',
        subject: 'Код подтверждения email - WELLIFY Business',
        textHeader: 'WELLIFY BUSINESS',
        textHeading: 'Подтверждение email',
        textBody: 'Вы начали регистрацию в системе управления сменами WELLIFY business.',
        textCode: 'Ваш код подтверждения:',
        textInstruction: 'Введите этот код на сайте для подтверждения вашей email адресы.',
        textValid: 'Код действителен в течение 15 минут.',
        textFooter: 'Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.',
      },
      uk: {
        title: 'Код підтвердження email | WELLIFY business',
        heading: 'Підтвердження email',
        paragraph1: 'Ви розпочали реєстрацію в системі управління змінами',
        paragraph2: 'Введіть код підтвердження нижче для завершення реєстрації.',
        codeLabel: 'Ваш код підтвердження:',
        codeValid: 'Код дійсний протягом 15 хвилин.',
        footer: 'Якщо ви не реєструвалися в WELLIFY business, просто проігноруйте цей лист.',
        subject: 'Код підтвердження email - WELLIFY Business',
        textHeader: 'WELLIFY BUSINESS',
        textHeading: 'Підтвердження email',
        textBody: 'Ви розпочали реєстрацію в системі управління змінами WELLIFY business.',
        textCode: 'Ваш код підтвердження:',
        textInstruction: 'Введіть цей код на сайті для підтвердження вашої email адреси.',
        textValid: 'Код дійсний протягом 15 хвилин.',
        textFooter: 'Якщо ви не реєструвалися в WELLIFY business, просто проігноруйте цей лист.',
      },
      en: {
        title: 'Email verification code | WELLIFY business',
        heading: 'Email verification',
        paragraph1: 'You have started registration in the shift management system',
        paragraph2: 'Enter the verification code below to complete registration.',
        codeLabel: 'Your verification code:',
        codeValid: 'The code is valid for 15 minutes.',
        footer: 'If you did not register with WELLIFY business, please ignore this email.',
        subject: 'Email verification code - WELLIFY Business',
        textHeader: 'WELLIFY BUSINESS',
        textHeading: 'Email verification',
        textBody: 'You have started registration in the shift management system WELLIFY business.',
        textCode: 'Your verification code:',
        textInstruction: 'Enter this code on the website to verify your email address.',
        textValid: 'The code is valid for 15 minutes.',
        textFooter: 'If you did not register with WELLIFY business, please ignore this email.',
      },
    };
    
    const t = texts[language];
    
    const html = `
<!doctype html>
<html lang="${htmlLang}">
  <head>
    <meta charset="UTF-8">
    <title>${t.title}</title>

    <!-- Дозволяємо світлу та темну тему -->
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">

    <style>
      /* Скидання */
      html, body {
        margin: 0;
        padding: 0;
      }

      body {
        margin: 0;
        padding: 0;
        background-color: #F8FAFC; /* light: background */
        color: #0F172A;            /* light: foreground */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      /* Кореневий контейнер */
      .wrapper {
        width: 100%;
        background-color: #F8FAFC; /* light page bg */
        padding: 32px 0;
      }

      .inner {
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
        background-color: #FFFFFF;   /* light card */
        border-radius: 16px;
        border: 1px solid #E2E8F0;   /* light border */
        padding: 32px 24px 28px 24px;
      }

      /* Заголовок по центру */
      .title {
        font-size: 22px;
        line-height: 1.3;
        font-weight: 700;
        text-align: center;
        color: #0F172A;
        margin: 0 0 24px 0;
      }

      .paragraph {
        font-size: 14px;
        line-height: 1.6;
        color: #64748B; /* muted-foreground */
        margin: 0 0 8px 0;
        text-align: center;
      }

      .paragraph-small {
        font-size: 12px;
        line-height: 1.6;
        color: #9CA3AF; /* soft text */
        margin: 16px 0 8px 0;
        text-align: left;
      }

      .nowrap {
        white-space: nowrap;
      }

      /* Код подтверждения */
      .code-container {
        padding: 24px 0 16px 0;
        text-align: center;
      }

      .code-label {
        font-size: 14px;
        line-height: 1.6;
        color: #64748B;
        margin: 0 0 12px 0;
        text-align: center;
      }

      .code-box {
        display: inline-block;
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 12px;
        color: #0F172A;
        background-color: #F1F5F9;
        border: 2px solid #E2E8F0;
        border-radius: 12px;
        padding: 20px 32px;
        margin: 0 auto;
        font-family: 'Courier New', monospace;
      }

      .footer {
        margin-top: 16px;
        text-align: left;
      }

      .footer-note {
        font-size: 11px;
        line-height: 1.6;
        color: #9CA3AF;
        margin: 0;
      }

      /* --- ТЕМНА ТЕМА (строго за токенами WELLIFY) --- */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #050B13; /* dark background */
          color: #E2E8F0;            /* dark foreground */
        }

        .wrapper {
          background-color: #050B13;
        }

        .inner {
          background-color: #0B1320;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .title {
          color: #E2E8F0;
        }

        .paragraph {
          color: #94A3B8;
        }

        .code-label {
          color: #94A3B8;
        }

        .code-box {
          color: #E2E8F0;
          background-color: #1E293B;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .paragraph-small,
        .footer-note {
          color: #9CA3AF;
        }
      }
    </style>
  </head>

  <body bgcolor="#F8FAFC" style="background-color:#F8FAFC;">
    <div class="wrapper">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;">
        <tr>
          <td align="center" style="background-color:#F8FAFC;">
            <div class="inner" style="background-color:#FFFFFF;">
              <h1 class="title">${t.heading}</h1>

              <p class="paragraph">
                ${t.paragraph1}
                <span class="nowrap"><strong>WELLIFY business</strong>.</span>
              </p>
              <p class="paragraph">
                ${t.paragraph2}
              </p>

              <div class="code-container">
                <p class="code-label">${t.codeLabel}</p>
                <div class="code-box">${code}</div>
              </div>

              <p class="paragraph-small">
                ${t.codeValid}
              </p>

              <div class="footer">
                <p class="footer-note">
                  ${t.footer}
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
    `;

    const text = `
${t.textHeader}

${t.textHeading}

${t.textBody}

${t.textCode} ${code}

${t.textInstruction}
${t.textValid}

${t.textFooter}
    `;

    await this.sendMail({
      to: email,
      subject: t.subject,
      html,
      text,
    });
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const html = `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>Код восстановления пароля | WELLIFY business</title>

    <!-- Дозволяємо світлу та темну тему -->
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">

    <style>
      /* Скидання */
      html, body {
        margin: 0;
        padding: 0;
      }

      body {
        margin: 0;
        padding: 0;
        background-color: #F8FAFC; /* light: background */
        color: #0F172A;            /* light: foreground */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      /* Кореневий контейнер */
      .wrapper {
        width: 100%;
        background-color: #F8FAFC; /* light page bg */
        padding: 32px 0;
      }

      .inner {
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
        background-color: #FFFFFF;   /* light card */
        border-radius: 16px;
        border: 1px solid #E2E8F0;   /* light border */
        padding: 32px 24px 28px 24px;
      }

      /* Заголовок по центру */
      .title {
        font-size: 22px;
        line-height: 1.3;
        font-weight: 700;
        text-align: center;
        color: #0F172A;
        margin: 0 0 24px 0;
      }

      .paragraph {
        font-size: 14px;
        line-height: 1.6;
        color: #64748B; /* muted-foreground */
        margin: 0 0 8px 0;
        text-align: center;
      }

      .paragraph-small {
        font-size: 12px;
        line-height: 1.6;
        color: #9CA3AF; /* soft text */
        margin: 16px 0 8px 0;
        text-align: left;
      }

      .nowrap {
        white-space: nowrap;
      }

      /* Код подтверждения */
      .code-container {
        padding: 24px 0 16px 0;
        text-align: center;
      }

      .code-label {
        font-size: 14px;
        line-height: 1.6;
        color: #64748B;
        margin: 0 0 12px 0;
        text-align: center;
      }

      .code-box {
        display: inline-block;
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 12px;
        color: #0F172A;
        background-color: #F1F5F9;
        border: 2px solid #E2E8F0;
        border-radius: 12px;
        padding: 20px 32px;
        margin: 0 auto;
        font-family: 'Courier New', monospace;
      }

      .footer {
        margin-top: 16px;
        text-align: left;
      }

      .footer-note {
        font-size: 11px;
        line-height: 1.6;
        color: #9CA3AF;
        margin: 0;
      }

      /* --- ТЕМНА ТЕМА (строго за токенами WELLIFY) --- */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #050B13; /* dark background */
          color: #E2E8F0;            /* dark foreground */
        }

        .wrapper {
          background-color: #050B13;
        }

        .inner {
          background-color: #0B1320;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .title {
          color: #E2E8F0;
        }

        .paragraph {
          color: #94A3B8;
        }

        .code-label {
          color: #94A3B8;
        }

        .code-box {
          color: #E2E8F0;
          background-color: #1E293B;
          border-color: rgba(148, 163, 184, 0.24);
        }

        .paragraph-small,
        .footer-note {
          color: #9CA3AF;
        }
      }
    </style>
  </head>

  <body bgcolor="#F8FAFC" style="background-color:#F8FAFC;">
    <div class="wrapper">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;">
        <tr>
          <td align="center" style="background-color:#F8FAFC;">
            <div class="inner" style="background-color:#FFFFFF;">
              <h1 class="title">Восстановление пароля</h1>

              <p class="paragraph">
                Вы запросили восстановление пароля в системе
                <span class="nowrap"><strong>WELLIFY business</strong>.</span>
              </p>
              <p class="paragraph">
                Введите код подтверждения ниже для создания нового пароля.
              </p>

              <div class="code-container">
                <p class="code-label">Ваш код подтверждения:</p>
                <div class="code-box">${code}</div>
              </div>

              <p class="paragraph-small">
                Код действителен в течение 15 минут.
              </p>

              <div class="footer">
                <p class="footer-note">
                  Если вы не запрашивали восстановление пароля в <span class="nowrap">WELLIFY business</span>, просто проигнорируйте это письмо.
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
    `;

    const text = `
WELLIFY BUSINESS

Восстановление пароля

Вы запросили восстановление пароля в системе WELLIFY business.

Ваш код подтверждения: ${code}

Введите этот код на сайте для создания нового пароля.
Код действителен в течение 15 минут.

Если вы не запрашивали восстановление пароля в WELLIFY business, просто проигнорируйте это письмо.
    `;

    await this.sendMail({
      to: email,
      subject: 'Код восстановления пароля - WELLIFY Business',
      html,
      text,
    });
  }
}










