// frontend/config/menu.ts

export type MenuCategory =
  | "drink"
  | "snack"
  | "entree"
  | "dessert"
  | "full_course";

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  messages: number;
  priceCents: number;
  description?: string;
  vegan?: boolean;
}

// You can tweak priceCents later; these are just sane placeholders.
export const MENU_ITEMS: MenuItem[] = [
  // DRINKS — +10 messages
  {
    id: "coffee",
    category: "drink",
    name: "Coffee",
    messages: 10,
    priceCents: 199,
    description: "Freshly brewed, bold and aromatic.",
    // vegan depends on milk choice, so leave undefined
  },
  {
    id: "cola",
    category: "drink",
    name: "Cola",
    messages: 10,
    priceCents: 199,
    description: "Classic cola served ice-cold.",
    vegan: true,
  },
  {
    id: "matcha",
    category: "drink",
    name: "Matcha",
    messages: 10,
    priceCents: 199,
    description: "Stone-ground matcha whisked to a smooth froth.",
  },
  {
    id: "latte",
    category: "drink",
    name: "Latte",
    messages: 10,
    priceCents: 199,
    description: "Rich espresso blended with steamed milk.",
  },
  {
    id: "apple_juice",
    category: "drink",
    name: "Apple Juice",
    messages: 10,
    priceCents: 199,
    description: "Crisp, refreshing juice from sweet apples.",
    vegan: true,
  },
  {
    id: "melon_soda",
    category: "drink",
    name: "Melon Soda",
    messages: 10,
    priceCents: 199,
    description: "Light, fizzy melon soda with a sweet finish.",
    vegan: true,
  },

  // SNACKS — +20 messages
  {
    id: "onigiri",
    category: "snack",
    name: "Onigiri",
    messages: 20,
    priceCents: 349,
    description: "Hand-pressed rice ball with a savory filling.",
  },
  {
    id: "edamame",
    category: "snack",
    name: "Edamame",
    messages: 20,
    priceCents: 349,
    description: "Steamed young soybeans sprinkled with sea salt.",
    vegan: true,
  },
  {
    id: "gyoza",
    category: "snack",
    name: "Gyoza",
    messages: 20,
    priceCents: 349,
    description: "Pan-fried dumplings with a juicy filling.",
  },
  {
    id: "dango",
    category: "snack",
    name: "Dango",
    messages: 20,
    priceCents: 349,
    description: "Sweet rice dumpling trio glazed in syrup.",
  },
  {
    id: "fries",
    category: "snack",
    name: "French Fries",
    messages: 20,
    priceCents: 349,
    description: "Crispy golden fries with light seasoning.",
    vegan: true,
  },
  {
    id: "inari_zushi",
    category: "snack",
    name: "Inari-Zushi",
    messages: 20,
    priceCents: 349,
    description: "Sweet tofu pockets filled with seasoned rice.",
    vegan: true,
  },

  // ENTREES — +40 messages
  {
    id: "club_sandwich",
    category: "entree",
    name: "Club Sandwich",
    messages: 40,
    priceCents: 599,
    description: "Toasted triple-stack sandwich with fresh greens and sauce.",
  },
  {
    id: "egg_sandwich",
    category: "entree",
    name: "Egg Sandwich",
    messages: 40,
    priceCents: 599,
    description: "Soft scrambled eggs on warm toasted bread.",
  },
  {
    id: "carbonara",
    category: "entree",
    name: "Carbonara",
    messages: 40,
    priceCents: 599,
    description: "Creamy pasta tossed with parmesan and pepper.",
  },
  {
    id: "spaghetti",
    category: "entree",
    name: "Spaghetti",
    messages: 40,
    priceCents: 599,
    description: "Tomato-simmered spaghetti with herbs and olive oil.",
  },
  {
    id: "katsudon",
    category: "entree",
    name: "Katsudon",
    messages: 40,
    priceCents: 599,
    description: "Crispy cutlet simmered with onions over rice.",
  },
  {
    id: "vegan_entree",
    category: "entree",
    name: "Vegan Entrée",
    messages: 40,
    priceCents: 599,
    description: "Hearty plant-based dish with seasonal ingredients.",
    vegan: true,
  },

  // DESSERTS — +30 messages
  {
    id: "ice_cream_float",
    category: "dessert",
    name: "Ice Cream Float",
    messages: 30,
    priceCents: 449,
    description: "Creamy vanilla ice cream over fizzy soda.",
  },
  {
    id: "cake",
    category: "dessert",
    name: "Cake Slice",
    messages: 30,
    priceCents: 449,
    description: "Light, moist cake with whipped cream frosting.",
  },
  {
    id: "fruit_tart",
    category: "dessert",
    name: "Fruit Tart",
    messages: 30,
    priceCents: 449,
    description: "Seasonal fruit layered over a crisp tart shell.",
  },
  {
    id: "vegan_berry_parfait",
    category: "dessert",
    name: "Vegan Berry Parfait",
    messages: 30,
    priceCents: 449,
    description: "Layers of berries, cream, and crunch, dairy-free.",
    vegan: true,
  },
  {
    id: "crepe",
    category: "dessert",
    name: "Crepe",
    messages: 30,
    priceCents: 449,
    description: "Warm crepe filled with cream and fruit.",
  },
  {
    id: "cheesecake",
    category: "dessert",
    name: "Cheesecake",
    messages: 30,
    priceCents: 449,
    description: "Rich, smooth cheesecake with a delicate crust.",
  },

  // FULL COURSE — combo placeholder (used for price / description only)
  {
    id: "kemono_full_course",
    category: "full_course",
    name: "Kemono Full Course",
    messages: 110, // ~10% bonus
    priceCents: 1399, // discount compared to $15.96
    description:
      "A complete Kemono Café experience!",
  },
];

// Helper used by CafeMenuButton / menu UI
export function groupMenuByCategory(): Record<MenuCategory, MenuItem[]> {
  const grouped: Record<MenuCategory, MenuItem[]> = {
    drink: [],
    snack: [],
    entree: [],
    dessert: [],
    full_course: [],
  };

  for (const item of MENU_ITEMS) {
    grouped[item.category].push(item);
  }

  return grouped;
}
