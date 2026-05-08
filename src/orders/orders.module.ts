import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './repositories/orders.repository';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDERS_REPOSITORY,
      useClass: OrdersRepository,
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
