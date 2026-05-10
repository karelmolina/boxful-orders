import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from './orders.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateOrderInput } from './orders.repository.interface';

describe('OrdersRepository', () => {
  let repository: OrdersRepository;
  let prismaService: jest.Mocked<Partial<DatabaseService>>;

  beforeEach(async () => {
    prismaService = {
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as unknown as DatabaseService['order'],
      shippingCostDay: {
        findUnique: jest.fn(),
      } as unknown as DatabaseService['shippingCostDay'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersRepository,
        { provide: DatabaseService, useValue: prismaService },
      ],
    }).compile();

    repository = module.get<OrdersRepository>(OrdersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createInput: CreateOrderInput = {
    pickupAddress: '123 Pickup St',
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
    deliveryDate: new Date('2026-05-11'),
    shippingType: 'STANDARD',
    shippingCost: 5.0,
    commissionCOD: 0,
    settlementAmount: 15.5,
  };

  const prismaOrder = {
    ...createInput,
    id: 'order-id',
    userId: null,
    status: 'PENDING',
    actualRecollectedAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create an order and return it', async () => {
      (prismaService.order!.create as jest.Mock).mockResolvedValue(prismaOrder);

      const result = await repository.create(createInput);

      expect(prismaService.order!.create).toHaveBeenCalledWith({
        data: { ...createInput, status: 'PENDING' },
      });
      expect(result).toEqual(prismaOrder);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      (prismaService.order!.findMany as jest.Mock).mockResolvedValue([
        prismaOrder,
      ]);

      const result = await repository.findAll();

      expect(prismaService.order!.findMany).toHaveBeenCalledWith();
      expect(result).toEqual([prismaOrder]);
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValue(
        prismaOrder,
      );

      const result = await repository.findById('order-id');

      expect(prismaService.order!.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-id' },
      });
      expect(result).toEqual(prismaOrder);
    });

    it('should return null when not found', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateStatusAndSettlement', () => {
    it('should update status and settlement', async () => {
      const updated = {
        ...prismaOrder,
        status: 'DELIVERED',
        settlementAmount: 20.0,
        actualRecollectedAmount: 100.0,
      };
      (prismaService.order!.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.updateStatusAndSettlement('order-id', {
        status: 'DELIVERED',
        settlementAmount: 20.0,
        actualRecollectedAmount: 100.0,
      });

      expect(prismaService.order!.update).toHaveBeenCalledWith({
        where: { id: 'order-id' },
        data: {
          status: 'DELIVERED',
          settlementAmount: 20.0,
          actualRecollectedAmount: 100.0,
        },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('findShippingCostByDay', () => {
    it('should return cost when found', async () => {
      (
        prismaService.shippingCostDay!.findUnique as jest.Mock
      ).mockResolvedValue({ day: 1, cost: 5.0 });

      const result = await repository.findShippingCostByDay(1);

      expect(prismaService.shippingCostDay!.findUnique).toHaveBeenCalledWith({
        where: { day: 1 },
      });
      expect(result).toBe(5.0);
    });

    it('should return null when not found', async () => {
      (
        prismaService.shippingCostDay!.findUnique as jest.Mock
      ).mockResolvedValue(null);

      const result = await repository.findShippingCostByDay(9);
      expect(result).toBeNull();
    });
  });
});
