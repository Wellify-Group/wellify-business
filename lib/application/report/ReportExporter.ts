/**
 * Report Exporter
 * Handles export operations (download, email, Google Drive)
 */

import { GeneratedReport } from '@/lib/domain/report/Report';
import { StorageService } from './StorageService';
import { MailerService } from './MailerService';

export type ExportTarget = 'DOWNLOAD' | 'EMAIL' | 'GOOGLE_DRIVE';

export class ReportExporter {
  constructor(
    private storageService: StorageService,
    private mailerService: MailerService,
    // private googleDriveClient?: GoogleDriveClient // на будущее
  ) {}

  /**
   * Export report for download
   * Returns signed URL for PDF/CSV download
   */
  async exportToDownload(report: GeneratedReport): Promise<string> {
    // Return signed URL for PDF download (expires in 1 hour)
    return this.storageService.getSignedUrl(report.filePdfPath, 3600);
  }

  /**
   * Export report via email
   */
  async exportToEmail(report: GeneratedReport, email: string): Promise<void> {
    // Get file buffer from storage
    const fileBuffer = await this.storageService.getFile(report.filePdfPath);

    // Determine report type label
    const reportTypeLabel = this.getReportTypeLabel(report.type);
    const periodLabel = `${new Date(report.period.from).toLocaleDateString('uk-UA')} - ${new Date(report.period.to).toLocaleDateString('uk-UA')}`;

    // Send email with attachment
    await this.mailerService.sendMail({
      to: email,
      subject: `Отчёт ${reportTypeLabel} за период ${periodLabel}`,
      text: `Во вложении отчёт ${reportTypeLabel} за период ${periodLabel}.`,
      html: `
        <p>Во вложении отчёт <strong>${reportTypeLabel}</strong> за период <strong>${periodLabel}</strong>.</p>
        <p>Дата создания: ${new Date(report.createdAt).toLocaleString('uk-UA')}</p>
      `,
      attachments: [
        {
          filename: `report-${report.id}.pdf`,
          content: fileBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Export report to Google Drive
   * 
   * ЗАГЛУШКА НА БУДУЩЕЕ
   */
  async exportToGoogleDrive(report: GeneratedReport, googleAccountId: string): Promise<void> {
    // Сейчас: кидаем ошибку "ещё не реализовано"
    throw new Error('Google Drive export not implemented yet. This feature is planned for future release.');

    // Future implementation:
    // if (!this.googleDriveClient) {
    //   throw new Error('Google Drive client not configured');
    // }
    // 
    // const fileBuffer = await this.storageService.getFile(report.filePdfPath);
    // await this.googleDriveClient.uploadFile({
    //   accountId: googleAccountId,
    //   fileName: `report-${report.id}.pdf`,
    //   fileBuffer,
    //   mimeType: 'application/pdf',
    // });
  }

  /**
   * Get human-readable report type label
   */
  private getReportTypeLabel(type: string): string {
    switch (type) {
      case 'SHIFT':
        return 'по смене';
      case 'DAY':
        return 'за день';
      case 'PERIOD':
        return 'за период';
      default:
        return 'отчёт';
    }
  }
}










