import { ApiProperty } from '@nestjs/swagger';

export class OrderRecipientResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;
}

export class OrderProductResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  weight: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userId: string | null;

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
