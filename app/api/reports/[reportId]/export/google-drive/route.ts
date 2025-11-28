import { NextRequest, NextResponse } from 'next/server';
import { ReportExporter } from '@/lib/application/report/ReportExporter';
import { StorageService } from '@/lib/application/report/StorageService';
import { MailerService } from '@/lib/application/report/MailerService';

// Note: ReportExporter uses services that may require Node.js fs/path - cannot use Edge Runtime
// export const runtime = 'edge';

/**
 * POST /api/reports/:reportId/export/google-drive
 * Export report to Google Drive
 * 
 * Body: { googleAccountId: string }
 * Response: { ok: true }
 * 
 * НА БУДУЩЕЕ: Этот endpoint зарезервирован, но пока не реализован
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;
    const body = await request.json();
    const { googleAccountId } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    if (!googleAccountId) {
      return NextResponse.json(
        { success: false, error: 'Google Account ID is required' },
        { status: 400 }
      );
    }

    // TODO: Load report from database using reportId
    // const report = await getReportById(reportId);
    // if (!report) {
    //   return NextResponse.json(
    //     { success: false, error: 'Report not found' },
    //     { status: 404 }
    //   );
    // }

    // Placeholder - Google Drive export not implemented yet
    return NextResponse.json(
      {
        success: false,
        error: 'Google Drive export not implemented yet. This feature is planned for future release.',
      },
      { status: 501 }
    );

    // Future implementation:
    // const storageService = new StorageService();
    // const mailerService = new MailerService();
    // const exporter = new ReportExporter(storageService, mailerService);
    // 
    // await exporter.exportToGoogleDrive(report, googleAccountId);
    // 
    // return NextResponse.json({
    //   success: true,
    //   ok: true,
    // });

  } catch (error: any) {
    console.error('[Export Google Drive API] Error:', error);
    
    // If error is explicitly about not being implemented, return 501
    if (error.message?.includes('not implemented')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export report to Google Drive',
      },
      { status: 500 }
    );
  }
}










