export enum Category {
  Tops = "tops",
  Bottoms = "bottoms",
  Footwear = "footwear",
  Layers = "layers",
  Accessories = "accessories",
}

export enum Subcategory {
  Shirt = "shirt",
  Tshirt = "tshirt",
  Chinos = "chinos",
  Jeans = "jeans",
  Sneakers = "sneakers",
  Loafers = "loafers",
  Jacket = "jacket",
  Sweater = "sweater",
  Coat = "coat",
  Watch = "watch",
  Belt = "belt",
  Shorts = "shorts",
  Boots = "boots",
  Chain = "chain",
  Bracelet = "bracelet",
  Earring = "earring"
}

export enum Color {
  Navy = "navy",
  White = "white",
  Black = "black",
  Beige = "beige",
  Grey = "grey",
  Olive = "olive",
  Brown = "brown",
  Maroon = "maroon"
}

export enum Pattern {
  Solid = "solid",
  Striped = "striped",
  Checkered = "checkered",
  Printed = "printed",
  Textured = "textured"
}

export enum Material {
  Cotton = "cotton",
  Linen = "linen",
  Denim = "denim",
  Wool = "wool",
  Synthetic = "synthetic",
  Leather = "leather",
  Blended = "blended",
  Metal = "metal"
}

export enum Fit {
  Slim = "slim",
  Regular = "regular",
  Relaxed = "relaxed"
}

export enum Formality {
  Casual = "casual",
  SmartCasual = "smart_casual",
  Formal = "formal"
}

export enum Status {
  Ready = "ready",
  Clean = "clean",
  Dirty = "dirty",
  Ironing = "ironing"
}

export interface WardrobeItem {
  id: string;
  title: string;
  category: Category;
  subcategory: Subcategory | string;
  primary_color: Color;
  secondary_colors: Color[];
  pattern: Pattern;
  material: Material;
  fit: Fit;
  formality: Formality;
  image_url: string;
  status: Status;
  wear_count: number;
  last_worn: string;
  brand?: string;
  size?: string;
  notes?: string;
}

export const DUMMY_WARDROBE: WardrobeItem[] = [
  {
    id: "t1", title: "Essential White Oxford", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.White, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Slim, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/crisp%20white%20oxford%20shirt%20lying%20flat%20minimalist%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 42, last_worn: "2026-03-25"
  },
  {
    id: "t2", title: "Navy Linen Shirt", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.Navy, secondary_colors: [], pattern: Pattern.Solid, material: Material.Linen,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/navy%20blue%20linen%20shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 15, last_worn: "2026-03-10"
  },
  {
    id: "t3", title: "Heavyweight Black Tee", category: Category.Tops, subcategory: Subcategory.Tshirt,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Relaxed, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/blank%20black%20heavyweight%20t-shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Dirty, wear_count: 56, last_worn: "2026-03-29"
  },
  {
    id: "t4", title: "Crisp White Crewneck", category: Category.Tops, subcategory: Subcategory.Tshirt,
    primary_color: Color.White, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/blank%20white%20crewneck%20t-shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Dirty, wear_count: 89, last_worn: "2026-03-29"
  },
  {
    id: "t5", title: "Heather Grey Tee", category: Category.Tops, subcategory: Subcategory.Tshirt,
    primary_color: Color.Grey, secondary_colors: [Color.White], pattern: Pattern.Textured, material: Material.Blended,
    fit: Fit.Slim, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/heather%20grey%20t-shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 34, last_worn: "2026-03-20"
  },
  {
    id: "t6", title: "Striped Breton Shirt", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.White, secondary_colors: [Color.Navy], pattern: Pattern.Striped, material: Material.Cotton,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/navy%20white%20striped%20breton%20shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 21, last_worn: "2026-03-15"
  },
  {
    id: "t7", title: "Olive Utility Shirt", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.Olive, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Relaxed, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/olive%20green%20utility%20overshirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 12, last_worn: "2026-02-28"
  },
  {
    id: "t8", title: "Classic Light Blue Oxford", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.Grey, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Slim, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/light%20blue%20oxford%20shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Ironing, wear_count: 67, last_worn: "2026-03-22"
  },
  {
    id: "b1", title: "Selvedge Denim Jeans", category: Category.Bottoms, subcategory: Subcategory.Jeans,
    primary_color: Color.Navy, secondary_colors: [], pattern: Pattern.Solid, material: Material.Denim,
    fit: Fit.Slim, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/raw%20indigo%20selvedge%20denim%20jeans%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Dirty, wear_count: 145, last_worn: "2026-03-28"
  },
  {
    id: "b2", title: "Beige Tailored Chinos", category: Category.Bottoms, subcategory: Subcategory.Chinos,
    primary_color: Color.Beige, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Slim, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/beige%20khaki%20tailored%20chinos%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 92, last_worn: "2026-03-25"
  },
  {
    id: "b3", title: "Olive Fatigue Pants", category: Category.Bottoms, subcategory: Subcategory.Chinos,
    primary_color: Color.Olive, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Relaxed, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/olive%20green%20fatigue%20pants%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 40, last_worn: "2026-03-12"
  },
  {
    id: "b4", title: "Charcoal Wool Trousers", category: Category.Bottoms, subcategory: Subcategory.Chinos,
    primary_color: Color.Grey, secondary_colors: [], pattern: Pattern.Textured, material: Material.Wool,
    fit: Fit.Regular, formality: Formality.Formal, 
    image_url: "https://image.pollinations.ai/prompt/charcoal%20grey%20wool%20trousers%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 18, last_worn: "2026-02-15"
  },
  {
    id: "b5", title: "Black Denim Jeans", category: Category.Bottoms, subcategory: Subcategory.Jeans,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Solid, material: Material.Denim,
    fit: Fit.Slim, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/black%20denim%20jeans%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 76, last_worn: "2026-03-27"
  },
  {
    id: "b6", title: "Navy Linen Shorts", category: Category.Bottoms, subcategory: Subcategory.Shorts,
    primary_color: Color.Navy, secondary_colors: [], pattern: Pattern.Solid, material: Material.Linen,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/navy%20blue%20linen%20shorts%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 8, last_worn: "2025-08-15"
  },
  {
    id: "l1", title: "Navy Merino Pullover", category: Category.Layers, subcategory: Subcategory.Sweater,
    primary_color: Color.Navy, secondary_colors: [], pattern: Pattern.Solid, material: Material.Wool,
    fit: Fit.Slim, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/navy%20blue%20merino%20wool%20crewneck%20sweater%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 55, last_worn: "2026-03-05"
  },
  {
    id: "l2", title: "Grey Cashmere Turtleneck", category: Category.Layers, subcategory: Subcategory.Sweater,
    primary_color: Color.Grey, secondary_colors: [], pattern: Pattern.Solid, material: Material.Wool,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/grey%20cashmere%20turtleneck%20sweater%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 14, last_worn: "2026-01-20"
  },
  {
    id: "l3", title: "Black Leather Moto Jacket", category: Category.Layers, subcategory: Subcategory.Jacket,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Solid, material: Material.Leather,
    fit: Fit.Slim, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/black%20leather%20biker%20jacket%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 85, last_worn: "2026-03-26"
  },
  {
    id: "l4", title: "Brown Chore Coat", category: Category.Layers, subcategory: Subcategory.Coat,
    primary_color: Color.Brown, secondary_colors: [], pattern: Pattern.Textured, material: Material.Denim,
    fit: Fit.Relaxed, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/brown%20canvas%20chore%20coat%20jacket%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 32, last_worn: "2026-03-18"
  },
  {
    id: "l5", title: "Tan Trench Coat", category: Category.Layers, subcategory: Subcategory.Coat,
    primary_color: Color.Beige, secondary_colors: [], pattern: Pattern.Solid, material: Material.Cotton,
    fit: Fit.Regular, formality: Formality.Formal, 
    image_url: "https://image.pollinations.ai/prompt/tan%20beige%20trench%20coat%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 10, last_worn: "2025-11-10"
  },
  {
    id: "f1", title: "Minimalist White Sneakers", category: Category.Footwear, subcategory: Subcategory.Sneakers,
    primary_color: Color.White, secondary_colors: [], pattern: Pattern.Solid, material: Material.Leather,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/minimalist%20all%20white%20leather%20sneakers%20shoes%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Dirty, wear_count: 210, last_worn: "2026-03-29"
  },
  {
    id: "f2", title: "Brown Penny Loafers", category: Category.Footwear, subcategory: Subcategory.Loafers,
    primary_color: Color.Brown, secondary_colors: [], pattern: Pattern.Solid, material: Material.Leather,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/brown%20leather%20penny%20loafers%20shoes%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 45, last_worn: "2026-03-24"
  },
  {
    id: "f3", title: "Black Chelsea Boots", category: Category.Footwear, subcategory: Subcategory.Boots,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Solid, material: Material.Leather,
    fit: Fit.Slim, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/black%20leather%20chelsea%20boots%20shoes%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 88, last_worn: "2026-02-28"
  },
  {
    id: "f4", title: "Olive Suede Desert Boots", category: Category.Footwear, subcategory: Subcategory.Boots,
    primary_color: Color.Olive, secondary_colors: [], pattern: Pattern.Textured, material: Material.Leather,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/olive%20green%20suede%20desert%20boots%20chukkas%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 24, last_worn: "2025-10-15"
  },
  {
    id: "f5", title: "Black Running Shoes", category: Category.Footwear, subcategory: Subcategory.Sneakers,
    primary_color: Color.Black, secondary_colors: [Color.White], pattern: Pattern.Solid, material: Material.Synthetic,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/black%20and%20white%20running%20shoes%20sneakers%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Dirty, wear_count: 130, last_worn: "2026-03-27"
  },
  {
    id: "a1", title: "Silver Dive Watch", category: Category.Accessories, subcategory: Subcategory.Watch,
    primary_color: Color.Grey, secondary_colors: [Color.Black], pattern: Pattern.Solid, material: Material.Synthetic,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/silver%20stainless%20steel%20dive%20watch%20black%20dial%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 365, last_worn: "2026-03-30"
  },
  {
    id: "a2", title: "Brown Leather Belt", category: Category.Accessories, subcategory: Subcategory.Belt,
    primary_color: Color.Brown, secondary_colors: [], pattern: Pattern.Solid, material: Material.Leather,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/brown%20leather%20belt%20silver%20buckle%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 140, last_worn: "2026-03-29"
  },
  {
    id: "a3", title: "Black Woven Belt", category: Category.Accessories, subcategory: Subcategory.Belt,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Textured, material: Material.Synthetic,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/black%20woven%20fabric%20belt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 65, last_worn: "2026-03-27"
  },
  {
    id: "t9", title: "Maroon Flannel Overshirt", category: Category.Tops, subcategory: Subcategory.Shirt,
    primary_color: Color.Maroon, secondary_colors: [Color.Black], pattern: Pattern.Checkered, material: Material.Cotton,
    fit: Fit.Relaxed, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/maroon%20plaid%20flannel%20shirt%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 45, last_worn: "2025-12-12"
  },
  {
    id: "t10", title: "Navy Graphic Tee", category: Category.Tops, subcategory: Subcategory.Tshirt,
    primary_color: Color.Navy, secondary_colors: [Color.White], pattern: Pattern.Printed, material: Material.Cotton,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/navy%20blue%20t-shirt%20with%20minimalist%20white%20graphic%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 22, last_worn: "2026-03-14"
  },
  {
    id: "a4", title: "Silver Pendant Chain", category: Category.Accessories, subcategory: Subcategory.Chain,
    primary_color: Color.Grey, secondary_colors: [], pattern: Pattern.Solid, material: Material.Metal,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/silver%20pendant%20chain%20necklace%20mens%20jewelry%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 120, last_worn: "2026-03-29"
  },
  {
    id: "a5", title: "Beaded Wood Bracelet", category: Category.Accessories, subcategory: Subcategory.Bracelet,
    primary_color: Color.Brown, secondary_colors: [], pattern: Pattern.Textured, material: Material.Blended,
    fit: Fit.Regular, formality: Formality.Casual, 
    image_url: "https://image.pollinations.ai/prompt/brown%20wooden%20bead%20bracelet%20mens%20jewelry%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 45, last_worn: "2026-03-25"
  },
  {
    id: "a6", title: "Black Onyx Stud", category: Category.Accessories, subcategory: Subcategory.Earring,
    primary_color: Color.Black, secondary_colors: [], pattern: Pattern.Solid, material: Material.Metal,
    fit: Fit.Regular, formality: Formality.SmartCasual, 
    image_url: "https://image.pollinations.ai/prompt/black%20onyx%20stud%20earring%20mens%20jewelry%20minimalist%20product%20photography?width=400&height=500&nologo=true",
    status: Status.Clean, wear_count: 80, last_worn: "2026-03-28"
  }
];
