import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
