import { IsString, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateStatusWebhookDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsIn(['DELIVERED', 'RETURNED'])
  status: string;

  @IsNumber()
  @Min(0)
  actualRecollectedAmount: number;
}
