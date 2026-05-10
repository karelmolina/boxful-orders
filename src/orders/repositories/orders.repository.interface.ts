import { Order } from '../entities/order.entity';

export interface CreateOrderInput {
  userId?: string;
  pickupAddress: string;
  recipient: Order['recipient'];
  products: Order['products'];
  isCOD: boolean;
  deliveryDate: Date;
  shippingType: string;
  shippingCost: number;
  commissionCOD: number;
  settlementAmount: number;
}

export interface UpdateStatusInput {
  status: string;
  actualRecollectedAmount?: number;
  settlementAmount?: number;
}

export interface IOrdersRepository {
  create(data: CreateOrderInput): Promise<Order>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findShippingCostByDay(day: number): Promise<number | null>;
  updateStatusAndSettlement(
    id: string,
    data: UpdateStatusInput,
  ): Promise<Order>;
}

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');
