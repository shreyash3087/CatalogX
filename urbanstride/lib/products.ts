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

export const FOOTWEAR_PRODUCTS: Product[] = [
  {
    id: 'prod_001',
    name: 'Nike Revolution 6',
    description: 'Lightweight everyday running shoe with responsive foam cushioning. Breathable mesh upper keeps feet cool during long runs. Ideal for road running and gym workouts.',
    category: 'running-shoes',
    brand: 'Nike',
    price_paise: 249900,
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black', 'white', 'blue'],
    stock: 12,
    tags: ['running', 'lightweight', 'road-running', 'gym', 'breathable'],
    image: '/assets/urbanstride/Shoe1.png',
    rating: 4.8,
    reviews_count: 328,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11'], required: true },
      { key: 'color', label: 'Color', type: 'select', available_options: ['black', 'white', 'blue'], required: false },
    ],
    offers: [
      {
        id: 'offer_nike_socks',
        type: 'bundle_add_on',
        name: 'Nike Everyday Cushioned Socks (3-Pack)',
        original_price_paise: 59900,
        bundle_price_paise: 24900,
        discount: '58% OFF',
        description: 'Add premium sweat-wicking Nike socks for only ₹249 (Save ₹350)',
      },
    ],
  },
  {
    id: 'prod_002',
    name: 'Adidas Lite Racer CLN 2.0',
    description: 'Clean and minimalist running shoe with Cloudfoam comfort. Perfect for casual runs and everyday wear. Slip-on design for easy on/off.',
    category: 'running-shoes',
    brand: 'Adidas',
    price_paise: 219900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['white', 'grey', 'black'],
    stock: 8,
    tags: ['running', 'casual', 'cloudfoam', 'slip-on', 'minimalist'],
    image: '/assets/urbanstride/Shoe2.png',
    rating: 4.7,
    reviews_count: 214,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_003',
    name: 'Puma Velocity NITRO 2',
    description: 'High-performance running shoe with NITRO foam technology for maximum energy return. Designed for speed training and race-day performance.',
    category: 'running-shoes',
    brand: 'Puma',
    price_paise: 289900,
    sizes: ['7', '8', '9', '10'],
    colors: ['electric-blue', 'black', 'green'],
    stock: 5,
    tags: ['running', 'performance', 'nitro-foam', 'speed', 'race'],
    image: '/assets/urbanstride/Shoe3.png',
    rating: 4.9,
    reviews_count: 145,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10'], required: true },
    ],
  },
  {
    id: 'prod_004',
    name: 'Skechers GO RUN Consistent',
    description: 'Well-cushioned lace-up runner with ULTRA LIGHT midsole and Air-Cooled Goga Mat insole. High-rebound cushioning for long distance training.',
    category: 'running-shoes',
    brand: 'Skechers',
    price_paise: 179900,
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['navy-orange', 'all-black', 'grey-lime'],
    stock: 20,
    tags: ['running', 'cushioned', 'goga-mat', 'ultra-light', 'wide-fit'],
    image: '/assets/urbanstride/Shoe4.png',
    rating: 4.6,
    reviews_count: 512,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11', '12'], required: true },
    ],
  },
  {
    id: 'prod_005',
    name: 'Reebok Forever Floatride Energy 4',
    description: 'Lightweight and responsive daily trainer with Floatride Energy Foam. Engineered mesh upper provides breathability and flexible support.',
    category: 'running-shoes',
    brand: 'Reebok',
    price_paise: 269900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['pure-grey', 'vector-navy', 'core-black'],
    stock: 7,
    tags: ['running', 'responsive', 'floatride', 'daily-trainer', 'durable'],
    image: '/assets/urbanstride/Shoe1.png',
    rating: 4.7,
    reviews_count: 98,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_006',
    name: 'Under Armour Charged Rogue 3',
    description: 'Dual-density Charged Cushioning midsole for the ultimate blend of comfort and explosive energy return. Lightweight two-tone mesh upper.',
    category: 'running-shoes',
    brand: 'Under Armour',
    price_paise: 239900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['black-white', 'mod-grey', 'academy-blue'],
    stock: 9,
    tags: ['running', 'charged-cushioning', 'energy-return', 'dual-density'],
    image: '/assets/urbanstride/Shoe2.png',
    rating: 4.8,
    reviews_count: 167,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_007',
    name: 'New Balance Fresh Foam 1080v13',
    description: 'The pinnacle of plush cushioning. Fresh Foam X midsole delivers unprecedented softness and smooth transitions for marathon distances.',
    category: 'running-shoes',
    brand: 'New Balance',
    price_paise: 349900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['starlight', 'black-metallic', 'white-silver'],
    stock: 4,
    tags: ['running', 'fresh-foam', 'max-cushion', 'marathon', 'premium'],
    image: '/assets/urbanstride/Shoe3.png',
    rating: 4.9,
    reviews_count: 420,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_008',
    name: 'ASICS Gel-Nimbus 25',
    description: 'PureGEL technology and FF BLAST PLUS ECO cushioning provide cloud-like softness. Engineered knit upper wraps the foot with a soft feel.',
    category: 'running-shoes',
    brand: 'ASICS',
    price_paise: 379900,
    sizes: ['7', '8', '9', '10'],
    colors: ['sheet-rock', 'black-pure-silver', 'island-blue'],
    stock: 0,
    tags: ['running', 'gel-cushioning', 'max-plush', 'long-distance'],
    image: '/assets/urbanstride/Shoe4.png',
    rating: 4.9,
    reviews_count: 610,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10'], required: true },
    ],
  },
  {
    id: 'prod_009',
    name: "Nike Air Force 1 '07",
    description: 'Legendary basketball-inspired streetwear sneaker. Crisp leather edges and Nike Air cushioning provide iconic style and comfort.',
    category: 'casual-sneakers',
    brand: 'Nike',
    price_paise: 799900,
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['triple-white', 'triple-black', 'white-gym-red'],
    stock: 15,
    tags: ['casual', 'air-force-1', 'streetwear', 'classic', 'leather', 'iconic'],
    image: '/assets/urbanstride/Shoe1.png',
    rating: 5.0,
    reviews_count: 1420,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11'], required: true },
    ],
    offers: [
      {
        id: 'offer_sneaker_crease_protector',
        type: 'bundle_add_on',
        name: 'Anti-Crease Shoe Shields (2 Pairs)',
        original_price_paise: 49900,
        bundle_price_paise: 19900,
        discount: '60% OFF',
        description: 'Keep your Air Force 1s crease-free for only ₹199 (Save ₹300)',
      },
    ],
  },
  {
    id: 'prod_010',
    name: 'Adidas Superstar',
    description: 'Classic shell-toe sneaker with three stripes. Versatile street style icon since 1969. Leather upper with rubber outsole.',
    category: 'casual-sneakers',
    brand: 'Adidas',
    price_paise: 699900,
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['white-black', 'all-black', 'white-gold'],
    stock: 11,
    tags: ['casual', 'classic', 'shell-toe', 'three-stripes', 'streetwear'],
    image: '/assets/urbanstride/Shoe2.png',
    rating: 4.8,
    reviews_count: 890,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_011',
    name: 'Puma Suede Classic XXI',
    description: 'Retro-inspired suede sneaker with softfoam comfort. A cult classic that transcends trends. Perfect for casual outings.',
    category: 'casual-sneakers',
    brand: 'Puma',
    price_paise: 499900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['navy-suede', 'red-suede', 'grey-suede'],
    stock: 8,
    tags: ['casual', 'suede', 'retro', 'classic', 'lifestyle'],
    image: '/assets/urbanstride/Shoe3.png',
    rating: 4.7,
    reviews_count: 420,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_012',
    name: "Skechers D'Lites 4.0",
    description: 'Chunky-soled lifestyle sneaker with memory foam insole. Lightweight and comfortable for all-day wear.',
    category: 'casual-sneakers',
    brand: 'Skechers',
    price_paise: 389900,
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['white-gold', 'black-silver', 'white-pink'],
    stock: 18,
    tags: ['casual', 'chunky', 'memory-foam', 'lifestyle', 'comfortable'],
    image: '/assets/urbanstride/Shoe4.png',
    rating: 4.6,
    reviews_count: 310,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11', '12'], required: true },
    ],
  },
  {
    id: 'prod_017',
    name: 'Woodland Waterproof Trekking Boot',
    description: 'Heavy-duty waterproof hiking boot with anti-skid rubber sole. Ideal for monsoon treks and rocky terrain. Nubuck leather upper with ankle support.',
    category: 'hiking-boots',
    brand: 'Woodland',
    price_paise: 499900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['brown', 'khaki', 'black'],
    stock: 10,
    tags: ['hiking', 'waterproof', 'trekking', 'nubuck', 'ankle-support'],
    image: '/assets/urbanstride/Image1.png',
    rating: 4.8,
    reviews_count: 670,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_022',
    name: 'Wildcraft Tundra Trekking Shoe',
    description: 'Indian-made waterproof trekking shoe with reinforced toe cap and ankle support. Built for the Himalayas. Affordable alternative to international brands.',
    category: 'hiking-boots',
    brand: 'Wildcraft',
    price_paise: 299900,
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['green', 'grey', 'black'],
    stock: 16,
    tags: ['hiking', 'trekking', 'affordable', 'indian-brand', 'himalayan'],
    image: '/assets/urbanstride/Image2.png',
    rating: 4.7,
    reviews_count: 389,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11'], required: true },
    ],
  },
  {
    id: 'prod_023',
    name: 'HRX by Hrithik Roshan RUN',
    description: 'Indian performance running shoe with EVA cushioning. Designed for daily training. Lightweight and breathable at an accessible price point.',
    category: 'running-shoes',
    brand: 'HRX',
    price_paise: 149900,
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black-red', 'blue-white', 'grey'],
    stock: 25,
    tags: ['running', 'indian-brand', 'affordable', 'eva-cushioning', 'training'],
    image: '/assets/urbanstride/Image3.png',
    rating: 4.5,
    reviews_count: 530,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11'], required: true },
    ],
    offers: [
      {
        id: 'offer_hrx_socks',
        type: 'bundle_add_on',
        name: 'HRX Anti-Blister Performance Socks (3-Pack)',
        original_price_paise: 49900,
        bundle_price_paise: 19900,
        discount: '60% OFF',
        description: 'Add breathable performance running socks for only ₹199 (Save ₹300)',
      },
    ],
  },
  {
    id: 'prod_024',
    name: 'Campus Hurricane',
    description: 'Budget-friendly running shoe with PU sole and mesh upper. Great for light jogging and school sports. Available in a wide size range.',
    category: 'running-shoes',
    brand: 'Campus',
    price_paise: 99900,
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['white', 'blue', 'black'],
    stock: 30,
    tags: ['running', 'budget', 'jogging', 'school-sports', 'pu-sole'],
    image: '/assets/urbanstride/Image4.png',
    rating: 4.4,
    reviews_count: 720,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['6', '7', '8', '9', '10', '11', '12'], required: true },
    ],
    offers: [
      {
        id: 'offer_campus_cleaner',
        type: 'bundle_add_on',
        name: 'Campus Quick-Clean Shoe Spray (150ml)',
        original_price_paise: 29900,
        bundle_price_paise: 9900,
        discount: '67% OFF',
        description: 'Add instant shoe cleaning foam spray for only ₹99 (Save ₹200)',
      },
    ],
  },
  {
    id: 'prod_025',
    name: 'Brooks Ghost 15',
    description: 'Balanced, smooth-riding neutral running shoe with DNA LOFT v2 cushioning. A trusted daily trainer for all paces. Brooks flagship neutral shoe.',
    category: 'running-shoes',
    brand: 'Brooks',
    price_paise: 319900,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['electric-blue', 'grey', 'black-red'],
    stock: 3,
    tags: ['running', 'neutral', 'daily-trainer', 'balanced', 'dna-loft'],
    image: '/assets/urbanstride/Shoe1.png',
    rating: 4.9,
    reviews_count: 850,
    required_options: [
      { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: ['7', '8', '9', '10', '11'], required: true },
    ],
  },
];
