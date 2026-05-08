import { InMemoryOrdersRepository } from './in-memory-orders.repository';
import { CreateOrderInput } from './orders.repository.interface';

describe('InMemoryOrdersRepository', () => {
  let repository: InMemoryOrdersRepository;

  beforeEach(() => {
    repository = new InMemoryOrdersRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  const createInput: CreateOrderInput = {
    recipient: {
      name: 'Alice',
      phone: '+50377777777',
      address: '123 Main St',
      city: 'City',
      state: 'State',
      zipCode: '12345',
    },
    products: [{ name: 'Widget', quantity: 2, unitPrice: 10.5, weight: 1.2 }],
    isCOD: false,
    deliveryDate: new Date('2026-05-11'),
    shippingType: 'STANDARD',
    shippingCost: 5.0,
    commissionCOD: 0,
    settlementAmount: 15.5,
  };

  describe('create', () => {
    it('should create an order with generated id', async () => {
      const order = await repository.create(createInput);
      expect(order.recipient.name).toBe('Alice');
      expect(order.status).toBe('PENDING');
      expect(order.id).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      await repository.create(createInput);
      const orders = await repository.findAll();
      expect(orders).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const created = await repository.create(createInput);
      const order = await repository.findById(created.id);
      expect(order).toBeDefined();
      expect(order?.id).toBe(created.id);
    });

    it('should return null when not found', async () => {
      const order = await repository.findById('non-existent');
      expect(order).toBeNull();
    });
  });

  describe('updateStatusAndSettlement', () => {
    it('should update status and settlement', async () => {
      const created = await repository.create(createInput);
      const updated = await repository.updateStatusAndSettlement(created.id, {
        status: 'DELIVERED',
        settlementAmount: 20.0,
        actualRecollectedAmount: 100.0,
      });
      expect(updated.status).toBe('DELIVERED');
      expect(updated.settlementAmount).toBe(20.0);
      expect(updated.actualRecollectedAmount).toBe(100.0);
    });

    it('should throw when order not found', async () => {
      await expect(
        repository.updateStatusAndSettlement('non-existent', {
          status: 'DELIVERED',
        }),
      ).rejects.toThrow('Order with id non-existent not found');
    });
  });

  describe('findShippingCostByDay', () => {
    it('should return cost when seeded', async () => {
      repository.seedShippingCost(1, 5.0);
      const cost = await repository.findShippingCostByDay(1);
      expect(cost).toBe(5.0);
    });

    it('should return null when not seeded', async () => {
      const cost = await repository.findShippingCostByDay(9);
      expect(cost).toBeNull();
    });
  });
});
