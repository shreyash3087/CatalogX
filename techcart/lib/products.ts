export interface ProductOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  available_options: string[];
  required: boolean;
}

export interface ProductOffer {
  id: string;
  type: 'bundle_add_on' | 'cross_sell' | 'discount';
  name: string;
  original_price_paise: number;
  bundle_price_paise: number;
  discount: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price_paise: number;
  sizes: string[];
  colors: string[];
  stock: number;
  tags: string[];
  image?: string;
  rating?: number;
  reviews_count?: number;
  required_options?: ProductOption[];
  offers?: ProductOffer[];
}

export const ELECTRONICS_PRODUCTS: Product[] = [
  {
    id: 'elec_001',
    name: 'boAt Rockerz 450 Pro',
    description: 'Wireless on-ear headphones with 70 hours playback and ASAP charge technology. Deep bass and comfortable earcups for prolonged listening.',
    category: 'electronics',
    brand: 'boAt',
    price_paise: 149900,
    sizes: ['onesize'],
    colors: ['black', 'blue', 'hazel-beige'],
    stock: 25,
    tags: ['headphones', 'earphones', 'earphone', 'wireless', 'audio', 'bass', 'cheap', 'long-battery', 'boat'],
    image: '/assets/techcart/headphones.jpg',
    rating: 4.6,
    reviews_count: 512,
    required_options: [
      { key: 'color', label: 'Color', type: 'select', available_options: ['black', 'blue', 'hazel-beige'], required: false },
    ],
    offers: [
      {
        id: 'offer_boat_case',
        type: 'bundle_add_on',
        name: 'Hard-Shell Shockproof Headphone Case',
        original_price_paise: 49900,
        bundle_price_paise: 19900,
        discount: '60% OFF',
        description: 'Add hard-shell travel case for only ₹199 (Save ₹300)',
      },
    ],
  },
  {
    id: 'elec_002',
    name: 'OnePlus Nord Buds 2r',
    description: 'True wireless in-ear earbuds with 12.4mm dynamic drivers and dual mic design for clear calls. IP55 water and sweat resistance.',
    category: 'electronics',
    brand: 'OnePlus',
    price_paise: 219900,
    sizes: ['onesize'],
    colors: ['grey', 'blue'],
    stock: 18,
    tags: ['earbuds', 'earphones', 'earphone', 'wireless', 'audio', 'oneplus', 'tws', 'sweatproof', 'in-ear'],
    image: '/assets/techcart/earbuds.jpg',
    rating: 4.8,
    reviews_count: 380,
    required_options: [
      { key: 'color', label: 'Color', type: 'select', available_options: ['grey', 'blue'], required: false },
    ],
    offers: [
      {
        id: 'offer_oneplus_case',
        type: 'bundle_add_on',
        name: 'Silicone Protective Case with Carabiner',
        original_price_paise: 39900,
        bundle_price_paise: 14900,
        discount: '62% OFF',
        description: 'Add protective silicone case & clip for only ₹149 (Save ₹250)',
      },
    ],
  },
  {
    id: 'elec_006',
    name: 'boAt Airdopes 141 ANC',
    description: 'True wireless earphones with Active Noise Cancellation (up to 32dB), 42 hours total playtime, and ENx technology quad mics.',
    category: 'electronics',
    brand: 'boAt',
    price_paise: 169900,
    sizes: ['onesize'],
    colors: ['black', 'white', 'cider-wood'],
    stock: 22,
    tags: ['earbuds', 'earphones', 'earphone', 'wireless', 'anc', 'tws', 'audio', 'boat', 'noise-cancelling'],
    image: '/assets/techcart/earbuds.jpg',
    rating: 4.7,
    reviews_count: 420,
    required_options: [
      { key: 'color', label: 'Color', type: 'select', available_options: ['black', 'white', 'cider-wood'], required: false },
    ],
    offers: [
      {
        id: 'offer_boat_lanyard',
        type: 'bundle_add_on',
        name: 'Anti-Loss Neck Lanyard & Pouch',
        original_price_paise: 29900,
        bundle_price_paise: 9900,
        discount: '67% OFF',
        description: 'Add safety strap & pouch for only ₹99 (Save ₹200)',
      },
    ],
  },
  {
    id: 'elec_007',
    name: 'Realme Buds T300',
    description: 'Dynamic bass wireless in-ear earphones with 30dB Active Noise Cancellation and 360-degree spatial audio effect.',
    category: 'electronics',
    brand: 'Realme',
    price_paise: 229900,
    sizes: ['onesize'],
    colors: ['stylish-black', 'youth-white'],
    stock: 15,
    tags: ['earbuds', 'earphones', 'earphone', 'wireless', 'anc', 'bass', 'realme', 'audio', 'tws'],
    image: '/assets/techcart/earbuds.jpg',
    rating: 4.7,
    reviews_count: 310,
    required_options: [
      { key: 'color', label: 'Color', type: 'select', available_options: ['stylish-black', 'youth-white'], required: false },
    ],
    offers: [
      {
        id: 'offer_realme_tips',
        type: 'bundle_add_on',
        name: 'Memory Foam Premium Ear Tips (3 Pairs)',
        original_price_paise: 34900,
        bundle_price_paise: 12900,
        discount: '63% OFF',
        description: 'Add memory foam tips set for only ₹129 (Save ₹220)',
      },
    ],
  },
  {
    id: 'elec_003',
    name: 'Sony WH-CH720N Noise Cancelling',
    description: 'Sony lightest wireless noise-cancelling overhead headphones. Equipped with Dual Noise Sensor technology and V1 processor.',
    category: 'electronics',
    brand: 'Sony',
    price_paise: 999000,
    sizes: ['onesize'],
    colors: ['black', 'blue', 'white'],
    stock: 6,
    tags: ['headphones', 'sony', 'noise-cancelling', 'premium', 'wireless'],
    image: '/assets/techcart/headphones.jpg',
    rating: 4.9,
    reviews_count: 890,
    required_options: [
      { key: 'color', label: 'Color', type: 'select', available_options: ['black', 'blue', 'white'], required: false },
    ],
    offers: [
      {
        id: 'offer_sony_stand',
        type: 'bundle_add_on',
        name: 'Aluminum Headphone Desk Stand',
        original_price_paise: 129900,
        bundle_price_paise: 49900,
        discount: '61% OFF',
        description: 'Add premium aluminum desk mount for only ₹499 (Save ₹800)',
      },
    ],
  },
  {
    id: 'elec_004',
    name: 'Keychron K2 V2 Mechanical Keyboard',
    description: '75% layout wireless mechanical keyboard with Mac & Windows compatibility. Gateron G Pro mechanical switches with hot-swappable options.',
    category: 'electronics',
    brand: 'Keychron',
    price_paise: 749900,
    sizes: ['onesize'],
    colors: ['rgb-aluminum', 'white-backlight'],
    stock: 10,
    tags: ['keyboard', 'mechanical', 'wireless', 'mac', 'keychron', 'hot-swap'],
    image: '/assets/techcart/keyboard.jpg',
    rating: 4.8,
    reviews_count: 640,
    required_options: [
      { key: 'switch_type', label: 'Mechanical Switch', type: 'select', available_options: ['Red (Linear)', 'Brown (Tactile)', 'Blue (Clicky)'], required: false },
    ],
    offers: [
      {
        id: 'offer_keychron_cable',
        type: 'bundle_add_on',
        name: 'Custom Aviator Coiled Type-C Cable',
        original_price_paise: 149900,
        bundle_price_paise: 59900,
        discount: '60% OFF',
        description: 'Add custom braided coiled aviator cable for only ₹599 (Save ₹900)',
      },
    ],
  },
  {
    id: 'elec_005',
    name: 'Noise ColorFit Ultra 3 Smartwatch',
    description: '1.96-inch AMOLED display with metallic build and Bluetooth calling. 150+ sports modes and comprehensive 24/7 health tracking suite.',
    category: 'electronics',
    brand: 'Noise',
    price_paise: 299900,
    sizes: ['onesize'],
    colors: ['jet-black', 'classic-brown', 'teal-blue'],
    stock: 14,
    tags: ['smartwatch', 'amoled', 'calling', 'fitness', 'noise'],
    image: '/assets/techcart/smartwatch.jpg',
    rating: 4.5,
    reviews_count: 730,
    required_options: [
      { key: 'color', label: 'Strap Color', type: 'select', available_options: ['jet-black', 'classic-brown', 'teal-blue'], required: false },
    ],
    offers: [
      {
        id: 'offer_noise_strap',
        type: 'bundle_add_on',
        name: 'Stainless Steel Milanese Magnetic Strap',
        original_price_paise: 69900,
        bundle_price_paise: 24900,
        discount: '64% OFF',
        description: 'Add premium metallic magnetic strap for only ₹249 (Save ₹450)',
      },
    ],
  },
];
