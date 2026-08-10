export const categories = [
  {
    id: "all",
    name: "All",
  },
  {
    id: "ramen",
    name: "Ramen",
  },
  {
    id: "starters",
    name: "Starters",
  },
  {
    id: "gyoza",
    name: "Gyoza",
  },
  {
    id: "rice",
    name: "Rice",
  },
  {
    id: "drinks",
    name: "Drinks",
  },
  {
    id: "desserts",
    name: "Desserts",
  },
];

export const products = [
  {
    id: "tonkotsu-ramen",
    name: "Tonkotsu Ramen",
    category: "ramen",
    price: 349,
    description:
      "Rich pork broth, handmade noodles, chashu, ajitama egg and spring onions.",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    spicy: 1,
    popular: true,
    available: true,
  },

  {
    id: "spicy-miso-ramen",
    name: "Spicy Miso Ramen",
    category: "ramen",
    price: 379,
    description:
      "Deep miso broth with chilli oil, corn, bamboo shoots and egg.",
    image:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    spicy: 3,
    popular: true,
    available: true,
  },

  {
    id: "shoyu-ramen",
    name: "Shoyu Ramen",
    category: "ramen",
    price: 329,
    description:
      "Classic soy-based broth with chicken chashu, nori and spring onions.",
    image:
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    spicy: 1,
    popular: false,
    available: true,
  },

  {
    id: "veg-tantanmen",
    name: "Veg Tantanmen",
    category: "ramen",
    price: 319,
    description:
      "Creamy sesame broth with vegetables, chilli oil, mushrooms and noodles.",
    image:
      "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    spicy: 2,
    popular: true,
    available: true,
  },

  {
    id: "chicken-gyoza",
    name: "Chicken Gyoza",
    category: "gyoza",
    price: 199,
    description:
      "Six pan-fried dumplings filled with seasoned chicken and vegetables.",
    image:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    spicy: 0,
    popular: true,
    available: true,
  },

  {
    id: "veg-gyoza",
    name: "Vegetable Gyoza",
    category: "gyoza",
    price: 179,
    description:
      "Crispy vegetable dumplings served with our house dipping sauce.",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    spicy: 1,
    popular: false,
    available: true,
  },
];