import { Injectable } from '@nestjs/common';
import {
  IOrdersRepository,
  CreateOrderInput,
  UpdateStatusInput,
} from './orders.repository.interface';
import { Order } from '../entities/order.entity';

@Injectable()
export class InMemoryOrdersRepository implements IOrdersRepository {
  private orders: Order[] = [];
  private shippingCosts = new Map<number, number>();

  seedShippingCost(day: number, cost: number): void {
    this.shippingCosts.set(day, cost);
  }

  create(data: CreateOrderInput): Promise<Order> {
    const now = new Date();
    const order: Order = {
      id: crypto.randomUUID(),
      userId: data.userId ?? null,
      pickupAddress: data.pickupAddress,
      recipient: data.recipient,
      products: data.products,
      isCOD: data.isCOD,
      deliveryDate: data.deliveryDate,
      shippingType: data.shippingType,
      status: 'PENDING',
      shippingCost: data.shippingCost,
      commissionCOD: data.commissionCOD,
      settlementAmount: data.settlementAmount,
      actualRecollectedAmount: null,
      createdAt: now,
      updatedAt: now,
    };
    this.orders.push(order);
    return Promise.resolve(order);
  }

  findAll(): Promise<Order[]> {
    return Promise.resolve([...this.orders]);
  }

  findById(id: string): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === id);
    return Promise.resolve(order ?? null);
  }

  findShippingCostByDay(day: number): Promise<number | null> {
    const cost = this.shippingCosts.get(day);
    return Promise.resolve(cost ?? null);
  }

  async updateStatusAndSettlement(
    id: string,
    data: UpdateStatusInput,
  ): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    order.status = data.status;
    if (data.actualRecollectedAmount !== undefined) {
      order.actualRecollectedAmount = data.actualRecollectedAmount;
    }
    if (data.settlementAmount !== undefined) {
      order.settlementAmount = data.settlementAmount;
    }
    order.updatedAt = new Date();
    return Promise.resolve(order);
  }

  clear(): void {
    this.orders = [];
  }
}
