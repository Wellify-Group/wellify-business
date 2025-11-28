import { NextRequest, NextResponse } from 'next/server';
import { saveOrder } from '@/lib/db';
import { Order } from '@/lib/store';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType, OrderCreatedPayload, OrderCommentAddedPayload } from '@/lib/shift-events';
import { getProductComponents, saveStockMovement, getIngredientById } from '@/lib/db-ingredients';
import { IngredientStockMovement } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/orders
 * Create a new order
 * 
 * Body: { 
 *   companyId: string,
 *   pointId: string,
 *   shiftId: string,
 *   employeeId: string,
 *   items: Array<{ id: string; name: string; quantity: number; pricePerUnit: number; total: number }>,
 *   paymentMethod: 'card' | 'cash',
 *   totalAmount: number,
 *   comment?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      pointId, 
      shiftId, 
      employeeId, 
      items, 
      paymentMethod, 
      totalAmount,
      comment 
    } = body;

    // Validation
    if (!pointId || !shiftId || !employeeId || !paymentMethod || totalAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Create order object
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      employeeId,
      locationId: pointId,
      shiftId,
      orderType: 'hall',
      paymentType: paymentMethod,
      amount: totalAmount,
      guestsCount: 1,
      comment: comment || items.map(item => `${item.name} x${item.quantity}`).join(', '),
      createdAt: new Date().toISOString(),
      items: items.map(item => ({
        id: item.id || item.name,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.pricePerUnit || item.total / item.quantity,
        totalPrice: item.total || item.pricePerUnit * item.quantity,
      })),
    };

    // Save to database
    await saveOrder(newOrder);

    // ===== АВТОМАТИЧЕСКОЕ СПИСАНИЕ ИНГРЕДИЕНТОВ =====
    try {
      if (companyId && items && items.length > 0) {
        // Для каждой позиции в заказе находим компоненты и списываем ингредиенты
        for (const item of items) {
          const productId = item.id || item.name;
          
          // Получаем все компоненты для этого товара
          const components = await getProductComponents(companyId, productId);
          
          if (components.length === 0) {
            // Товар не имеет связанных ингредиентов - пропускаем
            continue;
          }
          
          // Для каждого компонента создаём движение списания
          for (const component of components) {
            // Получаем ингредиент для получения unit
            const ingredient = await getIngredientById(companyId, component.ingredient_id);
            if (!ingredient) {
              console.warn(`Ingredient ${component.ingredient_id} not found, skipping`);
              continue;
            }
            
            // Рассчитываем общий расход: amount_per_unit * quantity_товара
            const totalConsumption = component.amount_per_unit * item.quantity;
            
            // Создаём движение списания
            const saleMovement: IngredientStockMovement = {
              id: `movement-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              company_id: companyId,
              point_id: pointId,
              ingredient_id: component.ingredient_id,
              type: 'sale',
              quantity: totalConsumption,
              unit: ingredient.unit,
              related_order_id: newOrder.id,
              related_shift_id: shiftId,
              comment: `Автоматическое списание при продаже ${item.name} x${item.quantity}`,
              created_by_user_id: employeeId,
              created_at: newOrder.createdAt,
            };
            
            await saveStockMovement(saleMovement);
          }
        }
      }
    } catch (error) {
      // Логируем ошибку, но не прерываем создание заказа
      console.error('Error auto-deducting ingredients:', error);
      // В реальной системе можно добавить уведомление или флаг ошибки
    }

    // Create ORDER_CREATED event
    if (companyId) {
      try {
        const orderCreatedPayload: OrderCreatedPayload = {
          order_id: newOrder.id,
          total_amount: totalAmount,
          payment_method: paymentMethod === 'card' ? 'card' : paymentMethod === 'online' ? 'online' : 'cash',
          items: items.map(item => ({
            product_id: item.id || item.name,
            name: item.name,
            qty: item.quantity,
            unit_price: item.pricePerUnit || item.total / item.quantity,
            total: item.total || item.pricePerUnit * item.quantity,
          })),
        };

        const orderCreatedEvent: ShiftEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          company_id: companyId,
          point_id: pointId,
          shift_id: shiftId,
          employee_id: employeeId,
          type: ShiftEventType.ORDER_CREATED,
          created_at: newOrder.createdAt,
          payload: orderCreatedPayload,
        };

        await saveShiftEvent(orderCreatedEvent);

        // If comment exists, create ORDER_COMMENT_ADDED event
        if (comment && comment.trim()) {
          const commentPayload: OrderCommentAddedPayload = {
            order_id: newOrder.id,
            comment: comment.trim(),
          };

          const commentEvent: ShiftEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            company_id: companyId,
            point_id: pointId,
            shift_id: shiftId,
            employee_id: employeeId,
            type: ShiftEventType.ORDER_COMMENT_ADDED,
            created_at: newOrder.createdAt,
            payload: commentPayload,
          };

          await saveShiftEvent(commentEvent);
        }
      } catch (error) {
        console.error('Error creating order events:', error);
        // Не прерываем процесс, если не удалось создать событие
      }
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

