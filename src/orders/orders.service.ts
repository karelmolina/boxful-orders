import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from './repositories/orders.repository.interface';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusWebhookDto } from './dto/update-status-webhook.dto';
import { SettlementBreakdownDto } from './dto/settlement-breakdown.dto';
import { TotalSettlementDto } from './dto/total-settlement.dto';

const MAX_COD_COMMISSION = 25.0;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const deliveryDate = new Date(dto.deliveryDate);
    const dayOfWeek = deliveryDate.getUTCDay();
    const shippingCost =
      await this.ordersRepository.findShippingCostByDay(dayOfWeek);
    if (shippingCost === null) {
      throw new BadRequestException(
        'Shipping cost not configured for delivery date',
      );
    }

    const productTotal = dto.expectedAmount ?? 0;
    const commissionCOD = 0; // se calcula sobre el monto real recolectado, no sobre estimado
    const settlementAmount = dto.isCOD
      ? productTotal - shippingCost
      : -shippingCost;

    return this.ordersRepository.create({
      userId: dto.userId,
      pickupAddress: dto.pickupAddress,
      recipient: dto.recipient,
      products: dto.products,
      isCOD: dto.isCOD,
      deliveryDate,
      shippingType: dto.shippingType,
      shippingCost,
      commissionCOD,
      settlementAmount,
    });
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  async findById(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getSettlement(id: string): Promise<SettlementBreakdownDto> {
    const order = await this.findById(id);

    const collectedAmount = order.actualRecollectedAmount ??
      (order.isCOD ? order.settlementAmount + order.shippingCost + order.commissionCOD : 0);

    const expenses: SettlementBreakdownDto['expenses'] = [
      { concept: 'Costo de envío', amount: -order.shippingCost },
    ];

    if (order.isCOD && order.commissionCOD > 0) {
      expenses.push({
        concept: 'Comisión por COD (0.01%)',
        amount: -order.commissionCOD,
      });
    }

    return {
      orderId: order.id,
      isCOD: order.isCOD,
      collectedAmount,
      expenses,
      settlementAmount: order.settlementAmount,
    };
  }

  async getTotalSettlement(): Promise<TotalSettlementDto> {
    const orders = await this.ordersRepository.findAll();

    let totalSettlement = 0;
    let totalCollected = 0;
    let totalShippingCosts = 0;
    let totalCommissionCOD = 0;
    let codOrdersCount = 0;
    let nonCodOrdersCount = 0;

    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;

      totalSettlement += order.settlementAmount;
      totalShippingCosts += order.shippingCost;
      totalCommissionCOD += order.commissionCOD;

      if (order.isCOD) {
        codOrdersCount++;
        totalCollected += order.actualRecollectedAmount ??
          (order.settlementAmount + order.shippingCost + order.commissionCOD);
      } else {
        nonCodOrdersCount++;
      }
    }

    return {
      totalOrders: orders.length,
      totalSettlement,
      totalCollected,
      totalShippingCosts,
      totalCommissionCOD,
      codOrdersCount,
      nonCodOrdersCount,
    };
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    return this.ordersRepository.updateStatusAndSettlement(id, {
      status: 'CANCELLED',
    });
  }

  async updateStatusFromWebhook(dto: UpdateStatusWebhookDto): Promise<Order> {
    const order = await this.findById(dto.orderId);
    let settlementAmount = order.settlementAmount;
    let commissionCOD = order.commissionCOD;

    if (
      dto.status === 'DELIVERED' &&
      order.isCOD &&
      dto.actualRecollectedAmount !== undefined
    ) {
      commissionCOD = Math.min(
        dto.actualRecollectedAmount * 0.0001,
        MAX_COD_COMMISSION,
      );
      settlementAmount =
        dto.actualRecollectedAmount - order.shippingCost - commissionCOD;
    }

    return this.ordersRepository.updateStatusAndSettlement(dto.orderId, {
      status: dto.status,
      actualRecollectedAmount: dto.actualRecollectedAmount,
      settlementAmount,
      commissionCOD,
    });
  }
}
