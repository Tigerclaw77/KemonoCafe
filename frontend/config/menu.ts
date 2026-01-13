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
    vegan: true,
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
    vegan: true,
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
    description: "Hand-pressed rice ball filled with seasoned salmon.",
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
    description: "Pan-fried dumplings with a juicy pork filling.",
  },
  {
    id: "dango",
    category: "snack",
    name: "Dango",
    messages: 20,
    priceCents: 349,
    description: "Sweet rice dumpling trio glazed in syrup.",
    vegan: true,
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
    description: "Toasted triple-stack sandwich with chicken, bacon, lettuce, tomato, and mayonnaise.",
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
    description: "Creamy pasta with egg, bacon, parmesan, and cracked pepper.",
  },
  {
    id: "spaghetti",
    category: "entree",
    name: "Spaghetti",
    messages: 40,
    priceCents: 599,
    description: "Tomato-simmered spaghetti with herbs and olive oil.",
    vegan: true,
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
    id: "eggplant_curry",
    category: "entree",
    name: "Eggplant Curry",
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
    description: "Creamy vanilla ice cream over fizzy melon soda.",
  },
  {
    id: "cake",
    category: "dessert",
    name: "Cake Slice",
    messages: 30,
    priceCents: 449,
    description: "Moist chocolate spongecake with lightly sweetened whipped cream.",
  },
  {
    id: "fruit_tart",
    category: "dessert",
    name: "Fruit Tart",
    messages: 30,
    priceCents: 449,
    description: "Seasonal fruit layered over vanilla custard in a crisp tart shell.",
  },
  {
    id: "berry_parfait",
    category: "dessert",
    name: "Berry Parfait",
    messages: 30,
    priceCents: 449,
    description: "Layers of fresh berries, almond cream, and crunchy granola.",
    vegan: true,
  },
  {
    id: "crepe",
    category: "dessert",
    name: "Crepe",
    messages: 30,
    priceCents: 449,
    description: "Warm crepe filled with seasonal fruit and lightly sweetened cream.",
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

export function buildMenuContext(): string {
  const lines: string[] = [];

  lines.push("Kemono Café Menu (authoritative):");
  lines.push("");

  for (const item of MENU_ITEMS) {
    lines.push(
      `- ${item.name} (${item.category}): ${item.description ?? "A menu item."}`
    );
  }

  lines.push("");
  lines.push("Menu rules:");
  lines.push("- All items grant messages as listed");
  lines.push("- Items have no variations or customizations");
  lines.push("- Do not invent new menu items");
  lines.push("- Do not offer substitutions");
  lines.push("- If unsure, say the menu has details");
  lines.push("- Describe items like a café server, not a chef");
  lines.push("- Focus on mood, comfort, and pairing");

  return lines.join("\n");
}
