import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  ORDERS_REPOSITORY,
  IOrdersRepository,
} from './repositories/orders.repository.interface';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusWebhookDto } from './dto/update-status-webhook.dto';

class MockOrdersRepository implements IOrdersRepository {
  private orders: Order[] = [];
  private shippingCosts = new Map<number, number>();

  async create(
    data: Parameters<IOrdersRepository['create']>[0],
  ): Promise<Order> {
    const order: Order = {
      id: crypto.randomUUID(),
      userId: data.userId ?? null,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(order);
    return order;
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders];
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  async findShippingCostByDay(day: number): Promise<number | null> {
    return this.shippingCosts.get(day) ?? null;
  }

  async updateStatusAndSettlement(
    id: string,
    data: Parameters<IOrdersRepository['updateStatusAndSettlement']>[1],
  ): Promise<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new Error('Not found');
    order.status = data.status;
    if (data.actualRecollectedAmount !== undefined) {
      order.actualRecollectedAmount = data.actualRecollectedAmount;
    }
    if (data.settlementAmount !== undefined) {
      order.settlementAmount = data.settlementAmount;
    }
    if (data.commissionCOD !== undefined) {
      order.commissionCOD = data.commissionCOD;
    }
    order.updatedAt = new Date();
    return order;
  }

  seedShippingCost(day: number, cost: number): void {
    this.shippingCosts.set(day, cost);
  }

  clear(): void {
    this.orders = [];
    this.shippingCosts.clear();
  }
}

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: MockOrdersRepository;

  beforeEach(async () => {
    repository = new MockOrdersRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: ORDERS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    repository.clear();
  });

  const baseDto: CreateOrderDto = {
    recipient: {
      name: 'Alice',
      phone: '+50377777777',
      address: '123 Main St',
      city: 'City',
      state: 'State',
      zipCode: '12345',
    },
    products: [
      { length: 15, height: 15, width: 15, weight: 3, content: 'Widget' },
    ],
    isCOD: false,
    deliveryDate: '2026-05-11',
    shippingType: 'STANDARD',
  };

  describe('create', () => {
    it('should create order with STANDARD shipping cost on Monday', async () => {
      repository.seedShippingCost(1, 5.0);
      const order = await service.create(baseDto);
      expect(order.shippingCost).toBe(5.0);
      expect(order.settlementAmount).toBe(-5.0); // no COD → settlement = -shippingCost
      expect(order.commissionCOD).toBe(0);
      expect(order.status).toBe('PENDING');
    });

    it('should create COD order with commission 0 (calculated on delivery)', async () => {
      repository.seedShippingCost(1, 5.0);
      const dto: CreateOrderDto = {
        ...baseDto,
        isCOD: true,
        expectedAmount: 1_000_000.0,
      };
      const order = await service.create(dto);
      expect(order.commissionCOD).toBe(0); // comisión se calcula al entregar
      expect(order.settlementAmount).toBeCloseTo(1_000_000.0 - 5.0, 5);
    });

    it('should create COD order with expected amount below cap', async () => {
      repository.seedShippingCost(1, 5.0);
      const dto: CreateOrderDto = {
        ...baseDto,
        isCOD: true,
        expectedAmount: 100.0,
      };
      const order = await service.create(dto);
      expect(order.commissionCOD).toBe(0); // comisión se calcula al entregar
      expect(order.settlementAmount).toBeCloseTo(100.0 - 5.0, 5);
    });

    it('should throw BadRequestException when shipping cost not found', async () => {
      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      repository.seedShippingCost(1, 5.0);
      await service.create(baseDto);
      const orders = await service.findAll();
      expect(orders).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      repository.seedShippingCost(1, 5.0);
      const created = await service.create(baseDto);
      const order = await service.findById(created.id);
      expect(order).toBeDefined();
      expect(order.id).toBe(created.id);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel pending order', async () => {
      repository.seedShippingCost(1, 5.0);
      const created = await service.create(baseDto);
      const cancelled = await service.cancel(created.id);
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException for non-pending order', async () => {
      repository.seedShippingCost(1, 5.0);
      const created = await service.create(baseDto);
      await repository.updateStatusAndSettlement(created.id, {
        status: 'IN_TRANSIT',
      });
      await expect(service.cancel(created.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatusFromWebhook', () => {
    it('should recalculate settlement and commission for COD DELIVERED with actual amount', async () => {
      repository.seedShippingCost(1, 5.0);
      const created = await service.create({
        ...baseDto,
        isCOD: true,
        expectedAmount: 8000.0,
      });
      expect(created.commissionCOD).toBe(0); // sin comisión al crear
      const dto: UpdateStatusWebhookDto = {
        orderId: created.id,
        status: 'DELIVERED',
        actualRecollectedAmount: 8000.0,
      };
      const updated = await service.updateStatusFromWebhook(dto);
      expect(updated.status).toBe('DELIVERED');
      expect(updated.actualRecollectedAmount).toBe(8000.0);
      expect(updated.commissionCOD).toBeCloseTo(0.8, 5);
      expect(updated.settlementAmount).toBeCloseTo(8000.0 - 5.0 - 0.8, 5);
    });

    it('should not change settlement for non-COD order', async () => {
      repository.seedShippingCost(1, 5.0);
      const created = await service.create(baseDto);
      const dto: UpdateStatusWebhookDto = {
        orderId: created.id,
        status: 'DELIVERED',
        actualRecollectedAmount: 100.0,
      };
      const updated = await service.updateStatusFromWebhook(dto);
      expect(updated.status).toBe('DELIVERED');
      expect(updated.settlementAmount).toBe(-5.0); // non-COD stays negative
    });

    it('should throw NotFoundException for missing order', async () => {
      const dto: UpdateStatusWebhookDto = {
        orderId: 'non-existent',
        status: 'DELIVERED',
        actualRecollectedAmount: 100.0,
      };
      await expect(service.updateStatusFromWebhook(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
