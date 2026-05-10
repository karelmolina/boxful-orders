import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateStatusWebhookDto {
  @ApiProperty({ example: 'order-id-123' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'DELIVERED', enum: ['DELIVERED', 'RETURNED'] })
  @IsString()
  @IsIn(['DELIVERED', 'RETURNED'])
  status: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  actualRecollectedAmount: number;
}
