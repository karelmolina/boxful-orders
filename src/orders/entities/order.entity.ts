export interface OrderRecipient {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface OrderProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  weight: number;
}

export class Order {
  id: string;
  userId: string | null;
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
