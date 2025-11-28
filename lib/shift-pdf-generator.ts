/**
 * Shift PDF Report Generator
 * 
 * Generates a PDF report for a shift using browser's print functionality
 * or jsPDF library (if available).
 */

import { Shift, Location, User } from './store';

// Extended shift interface that includes time tracking data
interface ExtendedShift extends Shift {
  startTime?: { actual: string; planned: string };
  endTime?: { actual: string; planned: string };
  zReportPhoto?: string;
  pointPhoto?: string;
}

export interface ShiftReportData {
  shift: Shift | ExtendedShift;
  location: Location | null;
  employee: User | null;
  currency: string;
}

/**
 * Generates and downloads a PDF report for a shift
 */
export function downloadShiftReport(data: ShiftReportData) {
  const { shift, location, employee, currency } = data;

  // Format date на украинском
  const shiftDate = new Date(shift.date);
  const formattedDate = shiftDate.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = shiftDate.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Форматируем время начала и окончания смены
  const startTime = shift.clockIn 
    ? new Date(shift.clockIn).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;
  
  const endTime = shift.clockOut
    ? new Date(shift.clockOut).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Calculate totals
  const totalRevenue = shift.revenueCash + shift.revenueCard;
  const avgCheck = shift.guestCount && shift.guestCount > 0 
    ? totalRevenue / shift.guestCount 
    : 0;

  // Get extended shift data if available
  const extendedShift = shift as any; // ExtendedShift with time tracking

  // Получаем URL логотипа
  const logoUrl = '/logo.svg';

  // Create HTML content for the report
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Звіт про зміну - ${formattedDate}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 40px;
          color: #1f2937;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .logo {
          margin-bottom: 15px;
        }
        .logo img {
          height: 40px;
          width: auto;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #111827;
        }
        .header .date {
          font-size: 16px;
          color: #6b7280;
          margin-top: 8px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        .info-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }
        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        .financial-item {
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
        }
        .financial-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .financial-value {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
        }
        .anomalies {
          padding: 15px;
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 6px;
          margin-top: 15px;
        }
        .anomalies-title {
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 8px;
        }
        .anomalies-list {
          list-style: none;
          padding-left: 0;
        }
        .anomalies-list li {
          padding: 4px 0;
          color: #991b1b;
          font-size: 14px;
        }
        .notes {
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
          margin-top: 15px;
        }
        .notes-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .notes-text {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body {
            padding: 20px;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <img src="${logoUrl}" alt="WELLIFY business" />
        </div>
        <h1>Звіт про зміну</h1>
        ${location ? `<div style="margin-top: 8px; color: #6b7280; font-size: 16px;">Точка: ${location.name}</div>` : ''}
        <div class="date">${formattedDate}, ${formattedTime}</div>
      </div>

      <div class="section">
        <div class="section-title">Інформація про співробітника</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Співробітник</div>
            <div class="info-value">${employee?.name || shift.employeeName || 'Не вказано'}</div>
          </div>
          ${employee?.jobTitle ? `
          <div class="info-item">
            <div class="info-label">Посада</div>
            <div class="info-value">${employee.jobTitle}</div>
          </div>
          ` : ''}
          ${location?.address ? `
          <div class="info-item">
            <div class="info-label">Адреса</div>
            <div class="info-value">${location.address}</div>
          </div>
          ` : ''}
          ${startTime ? `
          <div class="info-item">
            <div class="info-label">Початок зміни</div>
            <div class="info-value">${startTime}</div>
          </div>
          ` : ''}
          ${endTime ? `
          <div class="info-item">
            <div class="info-label">Закінчення зміни</div>
            <div class="info-value">${endTime}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Фінансові показники</div>
        <div class="financial-grid">
          <div class="financial-item">
            <div class="financial-label">Готівка</div>
            <div class="financial-value">${shift.revenueCash.toLocaleString('uk-UA')} ${currency}</div>
          </div>
          <div class="financial-item">
            <div class="financial-label">Картка</div>
            <div class="financial-value">${shift.revenueCard.toLocaleString('uk-UA')} ${currency}</div>
          </div>
          <div class="financial-item">
            <div class="financial-label">Разом</div>
            <div class="financial-value">${totalRevenue.toLocaleString('uk-UA')} ${currency}</div>
          </div>
        </div>
        <div class="info-grid" style="margin-top: 15px;">
          ${shift.guestCount ? `
          <div class="info-item">
            <div class="info-label">Кількість гостей</div>
            <div class="info-value">${shift.guestCount}</div>
          </div>
          ` : ''}
          ${avgCheck > 0 ? `
          <div class="info-item">
            <div class="info-label">Середній чек</div>
            <div class="info-value">${avgCheck.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ${currency}</div>
          </div>
          ` : ''}
          ${shift.checkCount ? `
          <div class="info-item">
            <div class="info-label">Кількість чеків</div>
            <div class="info-value">${shift.checkCount}</div>
          </div>
          ` : ''}
        </div>
      </div>

      ${shift.anomalies && shift.anomalies.length > 0 ? `
      <div class="section">
        <div class="anomalies">
          <div class="anomalies-title">Аномалії та зауваження</div>
          <ul class="anomalies-list">
            ${shift.anomalies.map(anomaly => `<li>• ${anomaly}</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : ''}

      ${shift.notes ? `
      <div class="section">
        <div class="notes">
          <div class="notes-title">Примітки</div>
          <div class="notes-text">${typeof shift.notes === 'string' ? shift.notes : JSON.stringify(shift.notes)}</div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Сформовано системою WELLIFY business</div>
        <div style="margin-top: 4px;">${new Date().toLocaleString('uk-UA', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Optionally close the window after printing
      // printWindow.close();
    }, 250);
  };
}

