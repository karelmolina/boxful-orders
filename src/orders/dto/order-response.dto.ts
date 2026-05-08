export class OrderResponseDto {
  id: string;
  userId: string | null;
  recipient: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
    weight: number;
  }[];
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
