import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  await prisma.user.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const hashedPassword = await bcrypt.hash("12345678", 10);

  await prisma.user.create({
    data: {
      email: "tom@test.com",
      password: hashedPassword,
      region: "Washington",
    },
  });

  await prisma.user.create({
    data: {
      email: "jerry@test.com",
      password: hashedPassword,
      region: "California",
    },
  });

  await prisma.product.create({
    data: {
      name: "iPhone 15",
      price: 1099,
      category: "Electronics",
    },
  });

  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
      price: 1099,
      category: "Electronics",
    },
  });

  const nintendo = await prisma.product.create({
    data: {
      name: "Nintendo Switch",
      price: 399,
      category: "Electronics",
    },
  });

  const futon = await prisma.product.create({
    data: {
      name: "Ultra Confirm Futon",
      price: 299,
      category: "Furniture",
    },
  });

  const sofa = await prisma.product.create({
    data: {
      name: "Luxury Leather Sofa",
      price: 2199,
      category: "Furniture",
    },
  });

  const tent = await prisma.product.create({
    data: {
      name: "2-Person Tent",
      price: 89,
      category: "Outdoor",
    },
  });

  const grill = await prisma.product.create({
    data: {
      name: "Barbecue Grill with Stand",
      price: 129,
      category: "Outdoor",
    },
  });

  await prisma.order.create({
    data: {
      region: "Washington",
      items: {
        create: [
          {
            product: { connect: { id: tent.id } },
            quantity: 2,
          },
          {
            product: { connect: { id: grill.id } },
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      region: "Washington",
      items: {
        create: [
          {
            product: { connect: { id: iphone.id } },
            quantity: 1,
          },
          {
            product: { connect: { id: sofa.id } },
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      region: "California",
      items: {
        create: [
          {
            product: { connect: { id: iphone.id } },
            quantity: 1,
          },
          {
            product: { connect: { id: nintendo.id } },
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      region: "California",
      items: {
        create: [
          {
            product: { connect: { id: sofa.id } },
            quantity: 1,
          },
          {
            product: { connect: { id: futon.id } },
            quantity: 1,
          },
        ],
      },
    },
  });

  await console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
