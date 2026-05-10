import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsBoolean,
  IsISO8601,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderRecipientDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @MinLength(8)
  phone: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  zipCode: string;
}

export class OrderProductDto {
  @ApiProperty({ example: 'Product A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  weight: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'user-id-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ type: OrderRecipientDto })
  @ValidateNested()
  @Type(() => OrderRecipientDto)
  recipient: OrderRecipientDto;

  @ApiProperty({ type: [OrderProductDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];

  @ApiProperty({ example: true })
  @IsBoolean()
  isCOD: boolean;

  @ApiProperty({ example: '2024-12-31' })
  @IsISO8601()
  deliveryDate: string;

  @ApiProperty({ example: 'STANDARD', enum: ['STANDARD', 'EXPRESS'] })
  @IsString()
  @IsIn(['STANDARD', 'EXPRESS'])
  shippingType: string;
}
