import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusWebhookDto } from './dto/update-status-webhook.dto';
import { Public } from '../auth/public.decorator';

class UpdateOrderStatusDto {
  status: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (dto.status === 'CANCELLED') {
      return this.ordersService.cancel(id);
    }
    // Future: handle other status transitions
    return this.ordersService.findById(id);
  }

  @Public()
  @Patch('webhook/update-status')
  @HttpCode(HttpStatus.OK)
  async updateStatusWebhook(@Body() dto: UpdateStatusWebhookDto) {
    return this.ordersService.updateStatusFromWebhook(dto);
  }
}
