import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_COD_COMMISSION = 25.0;

async function seedShippingCosts() {
  const days = [
    { day: 0, cost: 5.0 },
    { day: 1, cost: 5.0 },
    { day: 2, cost: 5.0 },
    { day: 3, cost: 5.0 },
    { day: 4, cost: 5.0 },
    { day: 5, cost: 7.0 },
    { day: 6, cost: 7.0 },
  ];

  for (const d of days) {
    await prisma.shippingCostDay.upsert({
      where: { day: d.day },
      update: {},
      create: d,
    });
  }

  console.log('Seeded ShippingCostDay table');
}

async function seedUser() {
  const user = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      dateOfBirth: new Date('1990-01-15'),
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      passwordHash:
        '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    },
  });

  console.log(`Seeded user: ${user.email} (${user.id})`);
  return user;
}

async function seedOrders(userId: string) {
  const existingCount = await prisma.order.count({ where: { userId } });

  if (existingCount > 0) {
    console.log(`Orders already exist for user ${userId}, skipping`);
    return;
  }

  const order1ExpectedAmount = 100.0;
  const order1ShippingCost = 5.0; // Tuesday (day 2)
  const order1CommissionCOD = Math.min(
    order1ExpectedAmount * 0.0001,
    MAX_COD_COMMISSION,
  );
  const order1SettlementAmount =
    order1ExpectedAmount - order1ShippingCost - order1CommissionCOD;

  await prisma.order.create({
    data: {
      userId,
      pickupAddress: '123 Warehouse Blvd, Industrial District',
      recipient: {
        name: 'Jane Smith',
        phone: '+1234567891',
        email: 'jane.smith@example.com',
        address: '456 Delivery Ave, Apt 12B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        referencePoint: 'Near Central Park',
        instructions: 'Call before delivery',
      },
      products: [
        {
          length: 15,
          height: 10,
          width: 8,
          weight: 2,
          content: 'Wireless Headphones',
        },
        {
          length: 20,
          height: 15,
          width: 12,
          weight: 5,
          content: 'Smart Watch',
        },
      ],
      isCOD: true,
      deliveryDate: new Date('2026-05-12'),
      shippingType: 'STANDARD',
      shippingCost: order1ShippingCost,
      commissionCOD: order1CommissionCOD,
      settlementAmount: order1SettlementAmount,
    },
  });

  const order2ExpectedAmount = 250.0;
  const order2ShippingCost = 7.0; // Saturday (day 6)
  const order2CommissionCOD = 0;
  const order2SettlementAmount =
    -order2ShippingCost;

  await prisma.order.create({
    data: {
      userId,
      pickupAddress: '789 Storage Ln, Commerce Park',
      recipient: {
        name: 'Bob Johnson',
        phone: '+1234567892',
        email: 'bob.johnson@example.com',
        address: '321 Recipient Rd, Suite 100',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        referencePoint: 'Next to the gas station',
      },
      products: [
        {
          length: 30,
          height: 20,
          width: 15,
          weight: 10,
          content: 'Laptop Computer',
        },
      ],
      isCOD: false,
      deliveryDate: new Date('2026-05-16'),
      shippingType: 'EXPRESS',
      shippingCost: order2ShippingCost,
      commissionCOD: order2CommissionCOD,
      settlementAmount: order2SettlementAmount,
    },
  });

  console.log('Seeded 2 orders');
}

async function main() {
  await seedShippingCosts();
  const user = await seedUser();
  await seedOrders(user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
