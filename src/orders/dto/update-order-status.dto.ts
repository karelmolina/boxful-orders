import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New status for the order' })
  @IsString()
  status: string;
}
