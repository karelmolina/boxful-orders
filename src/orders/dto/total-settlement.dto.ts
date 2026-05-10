import { ApiProperty } from '@nestjs/swagger';

export class TotalSettlementDto {
  @ApiProperty({ example: 15 })
  totalOrders: number;

  @ApiProperty({ example: 2450.75 })
  totalSettlement: number;

  @ApiProperty({ example: 3000.0 })
  totalCollected: number;

  @ApiProperty({ example: 525.0 })
  totalShippingCosts: number;

  @ApiProperty({ example: 24.25 })
  totalCommissionCOD: number;

  @ApiProperty({ example: 12 })
  codOrdersCount: number;

  @ApiProperty({ example: 3 })
  nonCodOrdersCount: number;
}
