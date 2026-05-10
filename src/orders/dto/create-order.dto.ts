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

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  email: string;

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

  @ApiPropertyOptional({ example: 'Near Central Park' })
  @IsOptional()
  @IsString()
  referencePoint?: string;

  @ApiPropertyOptional({ example: 'Call before delivery' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class OrderProductDto {
  @ApiProperty({ example: 15, description: 'Length in cm' })
  @IsNumber()
  @Min(0)
  length: number;

  @ApiProperty({ example: 15, description: 'Height in cm' })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 15, description: 'Width in cm' })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 3, description: 'Weight in pounds' })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ example: 'iPhone 14 Pro Max' })
  @IsString()
  @MinLength(1)
  content: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'user-id-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: '123 Pickup St' })
  @IsString()
  @MinLength(5)
  pickupAddress: string;

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

  @ApiPropertyOptional({
    example: 55.0,
    description: 'Expected package value for COD calculations',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedAmount?: number;
}
