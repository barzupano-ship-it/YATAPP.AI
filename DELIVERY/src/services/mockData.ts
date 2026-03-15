import type { Order } from '../context';

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    restaurant: "Joe's Pizza",
    pickupAddress: '123 Main St',
    deliveryAddress: '456 Oak Ave, Apt 4B',
    distance: '1.2 km',
    deliveryFee: '12 с.',
    items: '2x Margherita Pizza, 1x Caesar Salad',
    estimatedTime: '15 min',
    pickupLatitude: 37.7849,
    pickupLongitude: -122.4094,
    deliveryLatitude: 37.7912,
    deliveryLongitude: -122.4012,
  },
  {
    id: '2',
    restaurant: 'Sushi Palace',
    pickupAddress: '456 Oak Ave',
    deliveryAddress: '789 Elm Rd, Unit 12',
    distance: '2.5 km',
    deliveryFee: '12 с.',
    items: 'Dragon Roll, Miso Soup',
    estimatedTime: '22 min',
    pickupLatitude: 37.7812,
    pickupLongitude: -122.4056,
    deliveryLatitude: 37.7756,
    deliveryLongitude: -122.4189,
  },
  {
    id: '3',
    restaurant: 'Burger Haven',
    pickupAddress: '789 Elm Rd',
    deliveryAddress: '321 Pine St',
    distance: '0.8 km',
    deliveryFee: '12 с.',
    items: 'Double Cheeseburger, Fries',
    estimatedTime: '10 min',
    pickupLatitude: 37.7789,
    pickupLongitude: -122.4123,
    deliveryLatitude: 37.7823,
    deliveryLongitude: -122.4089,
  },
];

/** Заработок за каждый выполненный заказ: 12 сомони */
export const EARNINGS_PER_ORDER = 12;

export const MOCK_EARNINGS = {
  today: 36,
  week: 240,
  month: 960,
};
