/**
 * Domain types for Report system
 */

export type ReportType = 'SHIFT' | 'DAY' | 'PERIOD';

export interface ReportPayload {
  companyId: string;
  locationId: string;
  dateFrom: string; // ISO date string
  dateTo: string; // ISO date string
  type: ReportType;
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  period: {
    from: string;
    to: string;
  };
  filePdfPath: string; // s3/supabase path
  fileCsvPath?: string; // optional
  createdAt: string; // ISO date string
}










