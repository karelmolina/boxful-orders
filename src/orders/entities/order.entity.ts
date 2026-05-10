export interface OrderRecipient {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint?: string;
  instructions?: string;
}

export interface OrderProduct {
  length: number;
  height: number;
  width: number;
  weight: number;
  content: string;
}

export class Order {
  id: string;
  userId: string | null;
  pickupAddress: string;
  recipient: OrderRecipient;
  products: OrderProduct[];
  isCOD: boolean;
  deliveryDate: Date;
  shippingType: string;
  status: string;
  shippingCost: number;
  commissionCOD: number;
  settlementAmount: number;
  actualRecollectedAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}
