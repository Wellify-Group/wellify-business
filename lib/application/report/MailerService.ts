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
        from: this.fromEmail,
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
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>Код подтверждения email | WELLIFY business</title>

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

      /* Текст-логотип */
      .brand {
        text-align: center;
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #64748B; /* light muted-foreground */
        margin-bottom: 16px;
      }

      .brand strong {
        font-weight: 600;
        color: #0F172A; /* основний текст */
      }

      /* Заголовок по центру */
      .title {
        font-size: 22px;
        line-height: 1.3;
        font-weight: 700;
        text-align: center;
        color: #0F172A;
        margin: 0 0 16px 0;
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

        .brand {
          color: #9CA3AF;
        }

        .brand strong {
          color: #E2E8F0;
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
              <!-- Brand text -->
              <div class="brand">
                <span>WELLIFY <strong>BUSINESS</strong></span>
              </div>

              <h1 class="title">Подтверждение email</h1>

              <p class="paragraph">
                Вы начали регистрацию в системе управления сменами
                <span class="nowrap"><strong>WELLIFY business</strong>.</span>
              </p>
              <p class="paragraph">
                Введите код подтверждения ниже для завершения регистрации.
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
                  Если вы не регистрировались в <span class="nowrap">WELLIFY business</span>, просто проигнорируйте это письмо.
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

Подтверждение email

Вы начали регистрацию в системе управления сменами WELLIFY business.

Ваш код подтверждения: ${code}

Введите этот код на сайте для подтверждения вашего email адреса.
Код действителен в течение 15 минут.

Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.
    `;

    await this.sendMail({
      to: email,
      subject: 'Код подтверждения email - WELLIFY Business',
      html,
      text,
    });
  }
}










