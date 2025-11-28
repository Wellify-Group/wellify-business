import { NextRequest, NextResponse } from 'next/server';
import { getShifts } from '@/lib/db';
import { getLocationById } from '@/lib/db';
import { findUserByEmail } from '@/lib/db';
import { getShiftTasks } from '@/lib/db-shift-tasks';

export const runtime = 'edge';

/**
 * GET /api/shift-report/[shiftId]
 * Генерация PDF отчета о смене
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const { shiftId } = params;
    
    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'Shift ID is required' },
        { status: 400 }
      );
    }

    // Получаем смену из базы данных
    const allShifts = await getShifts();
    const shift = allShifts.find(s => s.id === shiftId);
    
    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Получаем данные о локации и сотруднике
    const location = shift.locationId ? await getLocationById(shift.locationId) : null;
    
    // Получаем задачи смены
    const tasks = await getShiftTasks(shiftId);
    const tasksStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      completionPercent: tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100),
    };
    
    // Форматируем дату на украинском
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

    // Форматируем время начала и окончания
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

    // Вычисляем итоги
    const totalRevenue = (shift.revenueCash || 0) + (shift.revenueCard || 0);
    const avgCheck = shift.guestCount && shift.guestCount > 0 
      ? totalRevenue / shift.guestCount 
      : 0;

    // Получаем базовый URL для логотипа
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.nextUrl.origin || 
                    'http://localhost:3000';
    const logoUrl = `${baseUrl}/logo.svg`;

    // Создаем HTML контент для PDF
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
          .tasks-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .tasks-table th,
          .tasks-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .tasks-table th {
            background: #f9fafb;
            font-weight: 600;
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tasks-table td {
            font-size: 14px;
            color: #1f2937;
          }
          .task-status-completed {
            color: #059669;
            font-weight: 500;
          }
          .task-status-not-completed {
            color: #dc2626;
            font-weight: 500;
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
              <div class="info-value">${shift.employeeName || 'Не вказано'}</div>
            </div>
            ${location ? `
            <div class="info-item">
              <div class="info-label">Точка</div>
              <div class="info-value">${location.name}</div>
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
              <div class="financial-value">${(shift.revenueCash || 0).toLocaleString('uk-UA')} ${shift.currency || '₴'}</div>
            </div>
            <div class="financial-item">
              <div class="financial-label">Картка</div>
              <div class="financial-value">${(shift.revenueCard || 0).toLocaleString('uk-UA')} ${shift.currency || '₴'}</div>
            </div>
            <div class="financial-item">
              <div class="financial-label">Разом</div>
              <div class="financial-value">${totalRevenue.toLocaleString('uk-UA')} ${shift.currency || '₴'}</div>
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
              <div class="info-value">${avgCheck.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ${shift.currency || '₴'}</div>
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

        ${tasks.length > 0 ? `
        <div class="section">
          <div class="section-title">Задачі зміни</div>
          <div class="info-item" style="margin-bottom: 15px;">
            <div class="info-label">Загальна статистика</div>
            <div class="info-value">Задач: ${tasksStats.completed} з ${tasksStats.total} виконано (${tasksStats.completionPercent}%)</div>
          </div>
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Статус</th>
                <th>Час виконання</th>
                <th>Співробітник</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map((task) => {
                const status = task.completed ? 'Виконана' : 'Не виконана';
                const statusClass = task.completed ? 'task-status-completed' : 'task-status-not-completed';
                const completedTime = task.completedAt 
                  ? new Date(task.completedAt).toLocaleTimeString('uk-UA', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '–';
                const employeeName = shift.employeeName || 'Не вказано';
                return `
                  <tr>
                    <td>${task.title}</td>
                    <td class="${statusClass}">${status}</td>
                    <td>${completedTime}</td>
                    <td>${employeeName}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${shift.anomalies && shift.anomalies.length > 0 ? `
        <div class="section">
          <div class="anomalies">
            <div class="anomalies-title">Аномалії та зауваження</div>
            <ul class="anomalies-list">
              ${shift.anomalies.map((anomaly: string) => `<li>• ${anomaly}</li>`).join('')}
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

    // Возвращаем HTML для генерации PDF (клиент может использовать window.print() или библиотеку для PDF)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="shift-report-${shiftId}.html"`,
      },
    });

  } catch (error: any) {
    console.error('Generate shift report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}





