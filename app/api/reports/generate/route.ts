import { NextRequest, NextResponse } from 'next/server';
import { ReportPayload } from '@/lib/domain/report/Report';
import { ReportService } from '@/lib/application/report/ReportService';
import { StorageService } from '@/lib/application/report/StorageService';

export const runtime = 'nodejs';

/**
 * POST /api/reports/generate
 * Generate a new report
 * 
 * Body: ReportPayload
 * Response: GeneratedReport
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReportPayload = await request.json();

    // Validation
    if (!body.companyId || !body.locationId || !body.dateFrom || !body.dateTo || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize services
    const storageService = new StorageService();
    const reportService = new ReportService(storageService);

    // Generate report
    const report = await reportService.generateReport(body);

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error: any) {
    console.error('[Generate Report API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}










