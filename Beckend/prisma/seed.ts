import bcrypt from "bcryptjs";
import { OrderStatus, UserRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Restaurant Owner",
      email: "owner@yatapp.local",
      phone: "+10000000001",
      passwordHash,
      role: UserRole.RESTAURANT,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Customer Demo",
      email: "customer@yatapp.local",
      phone: "+10000000002",
      passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  const courier = await prisma.user.create({
    data: {
      name: "Courier Demo",
      email: "courier@yatapp.local",
      phone: "+10000000003",
      passwordHash,
      role: UserRole.COURIER,
    },
  });

  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      street: "456 Oak Ave, Apt 2B",
      city: "Demo City",
      postalCode: "10001",
      phone: customer.phone,
      latitude: 41.881832,
      longitude: -87.623177,
      isDefault: true,
    },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: "YATAPP Bistro",
      address: "123 Main Street, Demo City",
      description: "Modern comfort food for delivery and pickup.",
      phone: "+10000000010",
      email: "bistro@yatapp.local",
      cuisine: "International",
      deliveryTime: 30,
      openingHours: "10:00 - 22:00",
      deliveryRadius: 5,
      logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
      coverImage:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200",
      latitude: 41.878113,
      longitude: -87.629799,
    },
  });

  const pizzaCategory = await prisma.menuCategory.create({
    data: {
      restaurantId: restaurant.id,
      name: "Pizza",
      sortOrder: 1,
    },
  });

  const drinksCategory = await prisma.menuCategory.create({
    data: {
      restaurantId: restaurant.id,
      name: "Drinks",
      sortOrder: 2,
    },
  });

  const margherita = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: pizzaCategory.id,
      name: "Margherita Pizza",
      description: "Tomato, mozzarella, basil",
      price: 12.99,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      available: true,
    },
  });

  const pepperoni = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: pizzaCategory.id,
      name: "Pepperoni Pizza",
      description: "Pepperoni, cheese, tomato sauce",
      price: 14.99,
      image:
        "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400",
      available: true,
    },
  });

  const lemonade = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: drinksCategory.id,
      name: "Fresh Lemonade",
      description: "House-made lemonade",
      price: 3.99,
      image:
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
      available: true,
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      deliveryAddressId: address.id,
      status: OrderStatus.PREPARING,
      subtotal: 16.98,
      deliveryFee: 4.99,
      totalPrice: 21.97,
      deliveryAddress: address.street,
      pickupAddress: restaurant.address,
      pickupLatitude: restaurant.latitude,
      pickupLongitude: restaurant.longitude,
      deliveryLatitude: address.latitude,
      deliveryLongitude: address.longitude,
      items: {
        create: [
          {
            menuItemId: margherita.id,
            nameSnapshot: margherita.name,
            priceSnapshot: margherita.price,
            quantity: 1,
          },
          {
            menuItemId: lemonade.id,
            nameSnapshot: lemonade.name,
            priceSnapshot: lemonade.price,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      deliveryAddressId: address.id,
      status: OrderStatus.READY,
      subtotal: 14.99,
      deliveryFee: 4.99,
      totalPrice: 19.98,
      deliveryAddress: address.street,
      pickupAddress: restaurant.address,
      pickupLatitude: restaurant.latitude,
      pickupLongitude: restaurant.longitude,
      deliveryLatitude: address.latitude,
      deliveryLongitude: address.longitude,
      items: {
        create: [
          {
            menuItemId: pepperoni.id,
            nameSnapshot: pepperoni.name,
            priceSnapshot: pepperoni.price,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      courierId: courier.id,
      deliveryAddressId: address.id,
      status: OrderStatus.DELIVERING,
      acceptedAt: new Date(),
      pickedUpAt: new Date(),
      subtotal: 12.99,
      deliveryFee: 4.99,
      totalPrice: 17.98,
      deliveryAddress: address.street,
      pickupAddress: restaurant.address,
      pickupLatitude: restaurant.latitude,
      pickupLongitude: restaurant.longitude,
      deliveryLatitude: address.latitude,
      deliveryLongitude: address.longitude,
      items: {
        create: [
          {
            menuItemId: margherita.id,
            nameSnapshot: margherita.name,
            priceSnapshot: margherita.price,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log("Seeded demo data:");
  console.log("owner@yatapp.local / password123");
  console.log("customer@yatapp.local / password123");
  console.log("courier@yatapp.local / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
