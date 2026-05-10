import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusWebhookDto } from './dto/update-status-webhook.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SettlementBreakdownDto } from './dto/settlement-breakdown.dto';
import { TotalSettlementDto } from './dto/total-settlement.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Returns list of orders' })
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get('download/csv')
  @ApiOperation({ summary: 'Download all orders as CSV' })
  @ApiResponse({ status: 200, description: 'Returns CSV file' })
  async downloadCsv(@Res() res: Response) {
    const csv = await this.ordersService.downloadCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.status(200).send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':id/settlement')
  @ApiOperation({ summary: 'Get settlement breakdown for an order' })
  @ApiResponse({
    status: 200,
    description: 'Returns settlement breakdown',
    type: SettlementBreakdownDto,
  })
  async getSettlement(@Param('id') id: string) {
    return this.ordersService.getSettlement(id);
  }

  @Get('settlement/total')
  @ApiOperation({ summary: 'Get total settlement across all orders' })
  @ApiResponse({
    status: 200,
    description: 'Returns total settlement summary',
    type: TotalSettlementDto,
  })
  async getTotalSettlement() {
    return this.ordersService.getTotalSettlement();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
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
  @ApiOperation({ summary: 'Update order status via webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async updateStatusWebhook(@Body() dto: UpdateStatusWebhookDto) {
    return this.ordersService.updateStatusFromWebhook(dto);
  }
}
