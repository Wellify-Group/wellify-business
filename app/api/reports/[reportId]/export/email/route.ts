import { NextRequest, NextResponse } from 'next/server';
import { ReportExporter } from '@/lib/application/report/ReportExporter';
import { StorageService } from '@/lib/application/report/StorageService';
import { MailerService } from '@/lib/application/report/MailerService';

/**
 * POST /api/reports/:reportId/export/email
 * Send report via email
 * 
 * Body: { email: string }
 * Response: { ok: true }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;
    const body = await request.json();
    const { email } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Load report from database using reportId
    // For now, we need report metadata (filePdfPath)
    // In production, load from DB:
    // const report = await getReportById(reportId);
    // if (!report) {
    //   return NextResponse.json(
    //     { success: false, error: 'Report not found' },
    //     { status: 404 }
    //   );
    // }

    // Placeholder - need actual report object
    return NextResponse.json(
      {
        success: false,
        error: 'Report loading from database not implemented yet. Please provide report object.',
      },
      { status: 501 }
    );

    // Once report is loaded:
    // const storageService = new StorageService();
    // const mailerService = new MailerService();
    // const exporter = new ReportExporter(storageService, mailerService);
    // 
    // await exporter.exportToEmail(report, email);
    // 
    // return NextResponse.json({
    //   success: true,
    //   ok: true,
    // });

  } catch (error: any) {
    console.error('[Export Email API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send report via email',
      },
      { status: 500 }
    );
  }
}










