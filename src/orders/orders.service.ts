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
import { stringify } from 'csv-stringify/sync';

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

  async downloadCsv(): Promise<string> {
    const orders = await this.findAll();
    const rows = orders.map((order) => ({
      id: order.id,
      userId: order.userId ?? '',
      pickupAddress: order.pickupAddress,
      recipientName: order.recipient.name,
      recipientPhone: order.recipient.phone,
      recipientEmail: order.recipient.email,
      recipientAddress: order.recipient.address,
      recipientCity: order.recipient.city,
      recipientState: order.recipient.state,
      recipientZipCode: order.recipient.zipCode,
      recipientReferencePoint: order.recipient.referencePoint ?? '',
      recipientInstructions: order.recipient.instructions ?? '',
      products: JSON.stringify(order.products),
      isCOD: String(order.isCOD),
      deliveryDate: order.deliveryDate.toISOString(),
      shippingType: order.shippingType,
      status: order.status,
      shippingCost: String(order.shippingCost),
      commissionCOD: String(order.commissionCOD),
      settlementAmount: String(order.settlementAmount),
      actualRecollectedAmount: order.actualRecollectedAmount ?? '',
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));
    return stringify(rows, {
      header: true,
      columns: [
        { key: 'id', header: 'id' },
        { key: 'userId', header: 'userId' },
        { key: 'pickupAddress', header: 'pickupAddress' },
        { key: 'recipientName', header: 'recipientName' },
        { key: 'recipientPhone', header: 'recipientPhone' },
        { key: 'recipientEmail', header: 'recipientEmail' },
        { key: 'recipientAddress', header: 'recipientAddress' },
        { key: 'recipientCity', header: 'recipientCity' },
        { key: 'recipientState', header: 'recipientState' },
        { key: 'recipientZipCode', header: 'recipientZipCode' },
        { key: 'recipientReferencePoint', header: 'recipientReferencePoint' },
        { key: 'recipientInstructions', header: 'recipientInstructions' },
        { key: 'products', header: 'products' },
        { key: 'isCOD', header: 'isCOD' },
        { key: 'deliveryDate', header: 'deliveryDate' },
        { key: 'shippingType', header: 'shippingType' },
        { key: 'status', header: 'status' },
        { key: 'shippingCost', header: 'shippingCost' },
        { key: 'commissionCOD', header: 'commissionCOD' },
        { key: 'settlementAmount', header: 'settlementAmount' },
        { key: 'actualRecollectedAmount', header: 'actualRecollectedAmount' },
        { key: 'createdAt', header: 'createdAt' },
        { key: 'updatedAt', header: 'updatedAt' },
      ],
    });
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

    const collectedAmount =
      order.actualRecollectedAmount ??
      (order.isCOD
        ? order.settlementAmount + order.shippingCost + order.commissionCOD
        : 0);

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

    const INCLUDED_STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED'];

    for (const order of orders) {
      if (!INCLUDED_STATUSES.includes(order.status)) continue;

      totalSettlement += order.settlementAmount;
      totalShippingCosts += order.shippingCost;
      totalCommissionCOD += order.commissionCOD;

      if (order.isCOD) {
        codOrdersCount++;
        totalCollected +=
          order.actualRecollectedAmount ??
          order.settlementAmount + order.shippingCost + order.commissionCOD;
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
