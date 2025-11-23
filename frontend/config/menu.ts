// frontend/config/menu.ts

export type MenuCategory = 'drink' | 'snack' | 'entree' | 'dessert' | 'full_course';

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  messages: number;
  priceCents: number; // placeholder, Stripe later
}

export const menuItems: MenuItem[] = [
  // DRINKS (+10)
  {
    id: 'drink_coffee',
    category: 'drink',
    name: 'Coffee',
    messages: 10,
    priceCents: 199,
  },
  {
    id: 'drink_cola',
    category: 'drink',
    name: 'Cola',
    messages: 10,
    priceCents: 199,
  },
  {
    id: 'drink_matcha',
    category: 'drink',
    name: 'Matcha Latte',
    messages: 10,
    priceCents: 199,
  },
  {
    id: 'drink_latte',
    category: 'drink',
    name: 'Cafe Latte',
    messages: 10,
    priceCents: 199,
  },
  {
    id: 'drink_apple_juice',
    category: 'drink',
    name: 'Apple Juice',
    messages: 10,
    priceCents: 199,
  },
  {
    id: 'drink_melon_soda',
    category: 'drink',
    name: 'Melon Soda',
    messages: 10,
    priceCents: 199,
  },

  // SNACKS (+20)
  {
    id: 'snack_onigiri',
    category: 'snack',
    name: 'Onigiri',
    messages: 20,
    priceCents: 349,
  },
  {
    id: 'snack_edamame',
    category: 'snack',
    name: 'Edamame',
    messages: 20,
    priceCents: 349,
  },
  {
    id: 'snack_gyoza',
    category: 'snack',
    name: 'Gyoza',
    messages: 20,
    priceCents: 349,
  },
  {
    id: 'snack_dango',
    category: 'snack',
    name: 'Dango',
    messages: 20,
    priceCents: 349,
  },
  {
    id: 'snack_fries',
    category: 'snack',
    name: 'French Fries',
    messages: 20,
    priceCents: 349,
  },
  {
    id: 'snack_inari',
    category: 'snack',
    name: 'Inari-zushi',
    messages: 20,
    priceCents: 349,
  },

  // ENTREES (+40)
  {
    id: 'entree_omurice',
    category: 'entree',
    name: 'Omurice',
    messages: 40,
    priceCents: 599,
  },
  {
    id: 'entree_egg_sandwich',
    category: 'entree',
    name: 'Egg Sandwich',
    messages: 40,
    priceCents: 599,
  },
  {
    id: 'entree_carbonara',
    category: 'entree',
    name: 'Creamy Carbonara',
    messages: 40,
    priceCents: 599,
  },
  {
    id: 'entree_spaghetti',
    category: 'entree',
    name: 'Spaghetti Napolitan',
    messages: 40,
    priceCents: 599,
  },
  {
    id: 'entree_katsudon',
    category: 'entree',
    name: 'Katsudon',
    messages: 40,
    priceCents: 599,
  },
  {
    id: 'entree_vegan_curry',
    category: 'entree',
    name: 'Vegan Curry',
    messages: 40,
    priceCents: 599,
  },

  // DESSERTS (+30)
  {
    id: 'dessert_parfait',
    category: 'dessert',
    name: 'Parfait',
    messages: 30,
    priceCents: 449,
  },
  {
    id: 'dessert_cake',
    category: 'dessert',
    name: 'Cake Slice',
    messages: 30,
    priceCents: 449,
  },
  {
    id: 'dessert_tart',
    category: 'dessert',
    name: 'Fruit Tart',
    messages: 30,
    priceCents: 449,
  },
  {
    id: 'dessert_banana_split',
    category: 'dessert',
    name: 'Banana Split',
    messages: 30,
    priceCents: 449,
  },
  {
    id: 'dessert_crepe',
    category: 'dessert',
    name: 'Crepe',
    messages: 30,
    priceCents: 449,
  },
  {
    id: 'dessert_cheesecake',
    category: 'dessert',
    name: 'Cheesecake',
    messages: 30,
    priceCents: 449,
  },

  // FULL COURSE (+100)
  {
    id: 'full_course_set',
    category: 'full_course',
    name: 'Full Course',
    messages: 100,
    priceCents: 1199,
  },
];

export function groupMenuByCategory() {
  const categories: Record<MenuCategory, MenuItem[]> = {
    drink: [],
    snack: [],
    entree: [],
    dessert: [],
    full_course: [],
  };

  for (const item of menuItems) {
    categories[item.category].push(item);
  }

  return categories;
}
