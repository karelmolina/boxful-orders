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
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;
}

export class OrderProductDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  weight: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @ValidateNested()
  @Type(() => OrderRecipientDto)
  recipient: OrderRecipientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];

  @IsBoolean()
  isCOD: boolean;

  @IsISO8601()
  deliveryDate: string;

  @IsString()
  @IsIn(['STANDARD', 'EXPRESS'])
  shippingType: string;
}
