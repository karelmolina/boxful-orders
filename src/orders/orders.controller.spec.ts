import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<Partial<OrdersService>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      cancel: jest.fn(),
      updateStatusFromWebhook: jest.fn(),
      downloadCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  const mockOrder: Order = {
    id: 'order-id',
    userId: null,
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
    deliveryDate: new Date(),
    shippingType: 'STANDARD',
    status: 'PENDING',
    shippingCost: 5.0,
    commissionCOD: 0,
    settlementAmount: 15.0,
    actualRecollectedAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('POST /orders', () => {
    it('should create an order', async () => {
      (service.create as jest.Mock).mockResolvedValue(mockOrder);
      const dto = {
        recipient: mockOrder.recipient,
        products: mockOrder.products,
        isCOD: false,
        deliveryDate: '2026-05-11',
        shippingType: 'STANDARD',
      };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('GET /orders', () => {
    it('should return all orders', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([mockOrder]);
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order when found', async () => {
      (service.findById as jest.Mock).mockResolvedValue(mockOrder);
      const result = await controller.findById('order-id');
      expect(service.findById).toHaveBeenCalledWith('order-id');
      expect(result).toEqual(mockOrder);
    });

    it('should propagate NotFoundException', async () => {
      (service.findById as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );
      await expect(controller.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /orders/:id', () => {
    it('should cancel pending order', async () => {
      (service.cancel as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });
      const result = await controller.updateStatus('order-id', {
        status: 'CANCELLED',
      });
      expect(service.cancel).toHaveBeenCalledWith('order-id');
      expect(result.status).toBe('CANCELLED');
    });

    it('should propagate BadRequestException', async () => {
      (service.cancel as jest.Mock).mockRejectedValue(
        new BadRequestException(),
      );
      await expect(
        controller.updateStatus('order-id', { status: 'CANCELLED' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PATCH /orders/webhook/update-status', () => {
    it('should update status from webhook', async () => {
      (service.updateStatusFromWebhook as jest.Mock).mockResolvedValue(
        mockOrder,
      );
      const dto = {
        orderId: 'order-id',
        status: 'DELIVERED',
        actualRecollectedAmount: 100.0,
      };
      const result = await controller.updateStatusWebhook(dto);
      expect(service.updateStatusFromWebhook).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('GET /orders/download/csv', () => {
    it('should set headers and send CSV', async () => {
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      (service.downloadCsv as jest.Mock).mockResolvedValue('csv-content');
      await controller.downloadCsv(res as any);
      expect(service.downloadCsv).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=orders.csv',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('csv-content');
    });

    it('should propagate errors from service', async () => {
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const error = new Error('CSV generation failed');
      (service.downloadCsv as jest.Mock).mockRejectedValue(error);
      await expect(controller.downloadCsv(res as any)).rejects.toThrow(
        'CSV generation failed',
      );
    });
  });
});
