import { NextRequest, NextResponse } from 'next/server';
import {
  getShiftBasicMetrics,
  getShiftOperationalMetrics,
  getShiftFinancialMetrics,
  getShiftQualityMetrics,
} from '@/lib/shift-metrics';

/**
 * GET /api/shifts/[shiftId]/metrics
 * Получает метрики смены
 * 
 * Query params:
 * - basic: boolean - базовые метрики (всегда включены)
 * - operational: boolean - операционные метрики
 * - financial: boolean - финансовые метрики
 * - quality: boolean - метрики качества
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const { shiftId } = params;
    const { searchParams } = new URL(request.url);
    
    const includeOperational = searchParams.get('operational') === 'true';
    const includeFinancial = searchParams.get('financial') === 'true';
    const includeQuality = searchParams.get('quality') === 'true';
    
    // Базовые метрики всегда включены
    const basic = await getShiftBasicMetrics(shiftId);
    
    const result: any = {
      success: true,
      basic,
    };
    
    if (includeOperational) {
      result.operational = await getShiftOperationalMetrics(shiftId);
    }
    
    if (includeFinancial) {
      // TODO: Получить средний чек по точке для расчета отклонения
      result.financial = await getShiftFinancialMetrics(shiftId);
    }
    
    if (includeQuality) {
      result.quality = await getShiftQualityMetrics(shiftId);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get shift metrics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









