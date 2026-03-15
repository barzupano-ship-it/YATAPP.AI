const IMAGES = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  taco: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
  noodles: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
  latte: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=200',
  tea: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200',
  matcha: 'https://images.unsplash.com/photo-1536256264058-2c31a10f93f9?w=200',
};

const ADDONS = [
  { id: 'a1', name: 'Latte', price: 2.0, image: IMAGES.latte },
  { id: 'a2', name: 'Nordic tea', price: 1.8, image: IMAGES.tea },
  { id: 'a3', name: 'Matcha latte', price: 1.95, image: IMAGES.matcha },
];

const withDetails = (item, defaults = {}) => ({
  ...item,
  weight: item.weight ?? defaults.weight ?? '200g',
  kcal: item.kcal ?? defaults.kcal ?? 350,
  ingredients:
    item.ingredients ??
    defaults.ingredients ??
    'Ingredients: fresh ingredients, spices, and seasonings.',
  addOns: item.addOns ?? ADDONS,
});

const items1 = [
  withDetails(
    { id: 'm1', name: 'Margherita Pizza', price: 12.99, image: IMAGES.pizza },
    { weight: '320g', kcal: 580 }
  ),
  withDetails(
    { id: 'm2', name: 'Pepperoni Pizza', price: 14.99, image: IMAGES.pizza },
    { weight: '350g', kcal: 620 }
  ),
  withDetails(
    { id: 'm3', name: 'BBQ Chicken Pizza', price: 15.99, image: IMAGES.pizza },
    { weight: '380g', kcal: 650 }
  ),
  withDetails(
    { id: 'm4', name: 'Caesar Salad', price: 8.99, image: IMAGES.salad },
    { weight: '230g', kcal: 280 }
  ),
];

const items2 = [
    withDetails(
      { id: 'm1', name: 'Salmon Nigiri', price: 9.99, image: IMAGES.sushi },
      { weight: '120g', kcal: 180 }
    ),
    withDetails(
      { id: 'm2', name: 'Dragon Roll', price: 16.99, image: IMAGES.sushi },
      { weight: '280g', kcal: 420 }
    ),
    withDetails(
      { id: 'm3', name: 'Tuna Sashimi', price: 18.99, image: IMAGES.sushi },
      { weight: '150g', kcal: 220 }
    ),
    withDetails(
      { id: 'm4', name: 'Miso Soup', price: 4.99, image: IMAGES.sushi },
      { weight: '250ml', kcal: 80 }
    ),
];

const items3 = [
    withDetails(
      { id: 'm1', name: 'Classic Cheeseburger', price: 11.99, image: IMAGES.burger },
      { weight: '280g', kcal: 520 }
    ),
    withDetails(
      { id: 'm2', name: 'Bacon BBQ Burger', price: 13.99, image: IMAGES.burger },
      { weight: '320g', kcal: 610 }
    ),
    withDetails(
      { id: 'm3', name: 'Veggie Burger', price: 10.99, image: IMAGES.burger },
      { weight: '250g', kcal: 380 }
    ),
    withDetails(
      { id: 'm4', name: 'Loaded Fries', price: 5.99, image: IMAGES.burger },
      { weight: '200g', kcal: 450 }
    ),
];

const items4 = [
    withDetails(
      { id: 'm1', name: 'Beef Tacos', price: 10.99, image: IMAGES.taco },
      { weight: '300g', kcal: 420 }
    ),
    withDetails(
      { id: 'm2', name: 'Chicken Burrito', price: 12.99, image: IMAGES.taco },
      { weight: '350g', kcal: 580 }
    ),
    withDetails(
      { id: 'm3', name: 'Guacamole & Chips', price: 6.99, image: IMAGES.taco },
      { weight: '200g', kcal: 320 }
    ),
    withDetails(
      { id: 'm4', name: 'Quesadilla', price: 9.99, image: IMAGES.taco },
      { weight: '250g', kcal: 480 }
    ),
];

const items5 = [
    withDetails(
      { id: 'm1', name: 'Kung Pao Chicken', price: 13.99, image: IMAGES.noodles },
      { weight: '350g', kcal: 520 }
    ),
    withDetails(
      { id: 'm2', name: 'Fried Rice', price: 11.99, image: IMAGES.noodles },
      { weight: '400g', kcal: 580 }
    ),
    withDetails(
      { id: 'm3', name: 'Sweet & Sour Pork', price: 14.99, image: IMAGES.noodles },
      { weight: '320g', kcal: 490 }
    ),
    withDetails(
      { id: 'm4', name: 'Spring Rolls', price: 6.99, image: IMAGES.noodles },
      { weight: '180g', kcal: 280 }
    ),
];

const items6 = [
    withDetails(
      { id: 'm1', name: 'Spaghetti Bolognese', price: 14.99, image: IMAGES.pasta },
      { weight: '400g', kcal: 620 }
    ),
    withDetails(
      { id: 'm2', name: 'Fettuccine Alfredo', price: 15.99, image: IMAGES.pasta },
      { weight: '380g', kcal: 680 }
    ),
    withDetails(
      { id: 'm3', name: 'Lasagna', price: 16.99, image: IMAGES.pasta },
      { weight: '350g', kcal: 550 }
    ),
    withDetails(
      { id: 'm4', name: 'Choco croissant', price: 5.9, image: IMAGES.dessert },
      {
        weight: '110g',
        kcal: 460,
        ingredients:
          'Ingredients: chicken eggs, flour, milk 3.2%, butter, water, dark chocolate 54-55%, melange, white sugar, cocoa powder, salt, vanillin.',
      }
    ),
];

export const FOOD_ITEMS = {
  '1': items1,
  '2': items2,
  '3': items3,
  '4': items4,
  '5': items5,
  '6': items6,
};

export const FOOD_CATEGORIES = {
  '1': [
    { id: 'pizza', name: 'Pizza', items: items1.slice(0, 3) },
    { id: 'salads', name: 'Salads', items: items1.slice(3, 4) },
  ],
  '2': [
    { id: 'sushi', name: 'Sushi', items: items2.slice(0, 3) },
    { id: 'soups', name: 'Soups', items: items2.slice(3, 4) },
  ],
  '3': [
    { id: 'burgers', name: 'Burgers', items: items3.slice(0, 3) },
    { id: 'sides', name: 'Sides', items: items3.slice(3, 4) },
  ],
  '4': [
    { id: 'tacos', name: 'Tacos', items: items4.slice(0, 2) },
    { id: 'burritos', name: 'Burritos', items: items4.slice(2, 3) },
    { id: 'sides', name: 'Sides', items: items4.slice(3, 4) },
  ],
  '5': [
    { id: 'main', name: 'Main dishes', items: items5.slice(0, 3) },
    { id: 'starters', name: 'Starters', items: items5.slice(3, 4) },
  ],
  '6': [
    { id: 'pasta', name: 'Pasta', items: items6.slice(0, 3) },
    { id: 'desserts', name: 'Desserts', items: items6.slice(3, 4) },
  ],
};
