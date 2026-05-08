import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IOrdersRepository,
  CreateOrderInput,
  UpdateStatusInput,
} from './orders.repository.interface';
import { Order, OrderProduct, OrderRecipient } from '../entities/order.entity';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class OrdersRepository implements IOrdersRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateOrderInput): Promise<Order> {
    const createData: Prisma.OrderCreateInput = {
      recipient: data.recipient as unknown as Prisma.InputJsonValue,
      products: data.products as unknown as Prisma.InputJsonValue,
      isCOD: data.isCOD,
      deliveryDate: data.deliveryDate,
      shippingType: data.shippingType,
      shippingCost: data.shippingCost,
      commissionCOD: data.commissionCOD,
      settlementAmount: data.settlementAmount,
      status: 'PENDING',
      userId: data.userId,
    };

    const order = await this.prisma.order.create({ data: createData });
    return this.mapToEntity(order);
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany();
    return orders.map((order) => this.mapToEntity(order));
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    return order ? this.mapToEntity(order) : null;
  }

  async findShippingCostByDay(day: number): Promise<number | null> {
    const record = await this.prisma.shippingCostDay.findUnique({
      where: { day },
    });
    return record ? record.cost : null;
  }

  async updateStatusAndSettlement(
    id: string,
    data: UpdateStatusInput,
  ): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.actualRecollectedAmount !== undefined && {
          actualRecollectedAmount: data.actualRecollectedAmount,
        }),
        ...(data.settlementAmount !== undefined && {
          settlementAmount: data.settlementAmount,
        }),
      },
    });
    return this.mapToEntity(order);
  }

  private mapToEntity(
    prismaOrder: Prisma.OrderGetPayload<Record<string, never>>,
  ): Order {
    return {
      ...prismaOrder,
      recipient: prismaOrder.recipient as unknown as OrderRecipient,
      products: prismaOrder.products as unknown as OrderProduct[],
    };
  }
}
