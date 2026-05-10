import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateStatusWebhookDto {
  @ApiProperty({ example: 'order-id-123' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'DELIVERED', enum: ['DELIVERED', 'RETURNED'] })
  @IsString()
  @IsIn(['DELIVERED', 'RETURNED'])
  status: string;

  @ApiPropertyOptional({ example: 100.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualRecollectedAmount?: number;
}
