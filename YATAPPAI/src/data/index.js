export { CATEGORIES } from './categories';
export { RESTAURANTS } from './restaurants';
export { FOOD_ITEMS, FOOD_CATEGORIES } from './foodItems';
import { RESTAURANTS } from './restaurants';
import { FOOD_ITEMS } from './foodItems';

export const getTopPicks = () =>
  RESTAURANTS.slice(0, 5).map((r) => {
    const items = FOOD_ITEMS[r.id] || [];
    const firstItem = items[0];
    return {
      restaurant: r,
      item: firstItem
        ? { ...firstItem, id: `${r.id}-${firstItem.id}` }
        : { id: `${r.id}-1`, name: r.name, price: 0, image: r.image },
    };
  });
