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

    const productTotal = dto.products.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0,
    );
    const commissionCOD = dto.isCOD
      ? Math.min(productTotal * 0.0001, MAX_COD_COMMISSION)
      : 0;
    const settlementAmount = dto.isCOD
      ? productTotal + shippingCost - commissionCOD
      : productTotal + shippingCost;

    return this.ordersRepository.create({
      userId: dto.userId,
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

    if (dto.status === 'DELIVERED' && order.isCOD) {
      const commissionCOD = Math.min(
        dto.actualRecollectedAmount * 0.0001,
        MAX_COD_COMMISSION,
      );
      settlementAmount =
        dto.actualRecollectedAmount + order.shippingCost - commissionCOD;
    }

    return this.ordersRepository.updateStatusAndSettlement(dto.orderId, {
      status: dto.status,
      actualRecollectedAmount: dto.actualRecollectedAmount,
      settlementAmount,
    });
  }
}
