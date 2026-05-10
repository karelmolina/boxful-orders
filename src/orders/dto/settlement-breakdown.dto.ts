import { ApiProperty } from '@nestjs/swagger';

class SettlementExpenseDto {
  @ApiProperty({ example: 'Costo de envío' })
  concept: string;

  @ApiProperty({ example: -5.0 })
  amount: number;
}

export class SettlementBreakdownDto {
  @ApiProperty({ example: 'order-id-123' })
  orderId: string;

  @ApiProperty({ example: true })
  isCOD: boolean;

  @ApiProperty({ example: 1000.0 })
  collectedAmount: number;

  @ApiProperty({ type: [SettlementExpenseDto] })
  expenses: SettlementExpenseDto[];

  @ApiProperty({ example: 994.9 })
  settlementAmount: number;
}
