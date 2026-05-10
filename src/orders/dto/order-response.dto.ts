import { ApiProperty } from '@nestjs/swagger';

export class OrderRecipientResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty({ nullable: true })
  referencePoint?: string;

  @ApiProperty({ nullable: true })
  instructions?: string;
}

export class OrderProductResponseDto {
  @ApiProperty()
  length: number;

  @ApiProperty()
  height: number;

  @ApiProperty()
  width: number;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  content: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userId: string | null;

  @ApiProperty()
  pickupAddress: string;

  @ApiProperty({ type: OrderRecipientResponseDto })
  recipient: OrderRecipientResponseDto;

  @ApiProperty({ type: [OrderProductResponseDto] })
  products: OrderProductResponseDto[];

  @ApiProperty()
  isCOD: boolean;

  @ApiProperty()
  deliveryDate: Date;

  @ApiProperty()
  shippingType: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  commissionCOD: number;

  @ApiProperty()
  settlementAmount: number;

  @ApiProperty({ nullable: true })
  actualRecollectedAmount: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
