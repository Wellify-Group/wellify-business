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
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code { font-size: 32px; font-weight: bold; text-align: center; 
                    background: #f4f4f4; padding: 20px; margin: 20px 0; 
                    border-radius: 8px; letter-spacing: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Подтверждение email</h2>
            <p>Ваш код подтверждения:</p>
            <div class="code">${code}</div>
            <p>Введите этот код на сайте для подтверждения вашего email адреса.</p>
            <p>Код действителен в течение 15 минут.</p>
            <div class="footer">
              <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Подтверждение email

Ваш код подтверждения: ${code}

Введите этот код на сайте для подтверждения вашего email адреса.
Код действителен в течение 15 минут.

Если вы не запрашивали этот код, просто проигнорируйте это письмо.
    `;

    await this.sendMail({
      to: email,
      subject: 'Код подтверждения email - WELLIFY Business',
      html,
      text,
    });
  }
}










