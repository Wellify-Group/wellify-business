/**
 * Report Service
 * Handles report generation (PDF, CSV)
 */

import { ReportPayload, GeneratedReport, ReportType } from '@/lib/domain/report/Report';
import { StorageService } from './StorageService';
import { getShifts } from '@/lib/db';
import { getLocationById } from '@/lib/db';
import { findUserByEmail } from '@/lib/db';

// TODO: Integrate with PDF generation library (puppeteer, pdfkit, etc.)
// For now, this is a placeholder that uses HTML generation

export class ReportService {
  constructor(private storageService: StorageService) {}

  /**
   * Generate report (PDF and optionally CSV)
   */
  async generateReport(payload: ReportPayload): Promise<GeneratedReport> {
    // 1. Fetch data from database
    const shifts = await getShifts(payload.locationId);
    
    // Filter shifts by date range
    const dateFrom = new Date(payload.dateFrom);
    const dateTo = new Date(payload.dateTo);
    dateTo.setHours(23, 59, 59, 999); // Include entire end date

    const filteredShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= dateFrom && shiftDate <= dateTo;
    });

    if (filteredShifts.length === 0) {
      throw new Error('No shifts found for the specified period');
    }

    // 2. Collect DTO for template (prepare report data)
    const reportData = await this.prepareReportData(filteredShifts, payload);

    // 3. Generate PDF (and optionally CSV)
    const pdfBuffer = await this.generatePdf(reportData, payload.type);
    
    // 4. Upload files to Supabase Storage
    const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const pdfPath = `reports/${payload.companyId}/${payload.locationId}/${reportId}.pdf`;
    
    await this.storageService.uploadFile(pdfPath, pdfBuffer, 'application/pdf');

    // Optional: Generate CSV
    let csvPath: string | undefined;
    if (payload.type === 'PERIOD') {
      const csvBuffer = await this.generateCsv(reportData, payload.type);
      csvPath = `reports/${payload.companyId}/${payload.locationId}/${reportId}.csv`;
      await this.storageService.uploadFile(csvPath, csvBuffer, 'text/csv');
    }

    // 5. Return report metadata
    return {
      id: reportId,
      type: payload.type,
      period: {
        from: payload.dateFrom,
        to: payload.dateTo,
      },
      filePdfPath: pdfPath,
      fileCsvPath: csvPath,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Prepare report data from shifts
   */
  private async prepareReportData(shifts: any[], payload: ReportPayload) {
    const location = payload.locationId ? await getLocationById(payload.locationId) : null;
    
    // Aggregate data based on report type
    const totalRevenue = shifts.reduce((sum, shift) => {
      return sum + (shift.revenueCash || 0) + (shift.revenueCard || 0);
    }, 0);

    const totalGuests = shifts.reduce((sum, shift) => sum + (shift.guestCount || 0), 0);
    const totalChecks = shifts.reduce((sum, shift) => sum + (shift.checkCount || 0), 0);

    return {
      shifts,
      location,
      totals: {
        revenue: totalRevenue,
        guests: totalGuests,
        checks: totalChecks,
      },
      period: {
        from: payload.dateFrom,
        to: payload.dateTo,
      },
    };
  }

  /**
   * Generate PDF buffer from report data
   * 
   * TODO: Implement actual PDF generation using puppeteer, pdfkit, or similar
   */
  private async generatePdf(reportData: any, reportType: ReportType): Promise<Buffer> {
    // TODO: Use puppeteer or pdfkit to generate PDF
    // For now, return empty buffer as placeholder
    
    // Example with puppeteer (commented out):
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // const html = this.generateHtml(reportData, reportType);
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return Buffer.from(pdf);

    throw new Error('PDF generation not implemented. Please install puppeteer or pdfkit.');
  }

  /**
   * Generate CSV buffer from report data
   */
  private async generateCsv(reportData: any, reportType: ReportType): Promise<Buffer> {
    const headers = ['Дата', 'Сотрудник', 'Выручка (Наличные)', 'Выручка (Карта)', 'Гости', 'Чеки'];
    const rows = reportData.shifts.map((shift: any) => [
      new Date(shift.date).toLocaleDateString('uk-UA'),
      shift.employeeName || '',
      shift.revenueCash || 0,
      shift.revenueCard || 0,
      shift.guestCount || 0,
      shift.checkCount || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }
}










