'use strict';

/**
 * CatalogX — Product Seed Data
 * Seeds 25 footwear products across 3 categories for UrbanStride Footwear.
 * Includes intentional edge cases: out-of-stock items, various price ranges.
 *
 * Run: node src/db/seed.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./init');

const FOOTWEAR_PRODUCTS = [
  // ─── RUNNING SHOES ───────────────────────────────────────────────────────
  {
    id: 'prod_001',
    name: 'Nike Revolution 6',
    description: 'Lightweight everyday running shoe with responsive foam cushioning. Breathable mesh upper keeps feet cool during long runs. Ideal for road running and gym workouts.',
    category: 'running-shoes',
    brand: 'Nike',
    price_paise: 249900,  // ₹2,499
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black', 'white', 'blue'],
    stock: 12,
    tags: ['running', 'lightweight', 'road-running', 'gym', 'breathable'],
  },
  {
    id: 'prod_002',
    name: 'Adidas Lite Racer CLN 2.0',
    description: 'Clean and minimalist running shoe with Cloudfoam comfort. Perfect for casual runs and everyday wear. Slip-on design for easy on/off.',
    category: 'running-shoes',
    brand: 'Adidas',
    price_paise: 219900,  // ₹2,199
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['white', 'grey', 'black'],
    stock: 8,
    tags: ['running', 'casual', 'cloudfoam', 'slip-on', 'minimalist'],
  },
  {
    id: 'prod_003',
    name: 'Puma Velocity NITRO 2',
    description: 'High-performance running shoe with NITRO foam technology for maximum energy return. Designed for speed training and race-day performance.',
    category: 'running-shoes',
    brand: 'Puma',
    price_paise: 289900,  // ₹2,899
    sizes: ['7', '8', '9', '10'],
    colors: ['electric-blue', 'black', 'green'],
    stock: 5,
    tags: ['running', 'performance', 'nitro-foam', 'speed', 'race'],
  },
  {
    id: 'prod_004',
    name: 'Skechers GO RUN Consistent',
    description: 'Affordable and durable running shoe with responsive 5GEN cushioning. Great for beginners and everyday joggers. Machine washable upper.',
    category: 'running-shoes',
    brand: 'Skechers',
    price_paise: 179900,  // ₹1,799
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['navy', 'red', 'black'],
    stock: 20,
    tags: ['running', 'beginner', 'affordable', 'cushioning', 'everyday'],
  },
  {
    id: 'prod_005',
    name: 'Reebok Forever Floatride Energy 4',
    description: 'Premium running shoe with Floatride Energy foam for plush yet responsive cushioning. Ideal for long-distance running and marathon training.',
    category: 'running-shoes',
    brand: 'Reebok',
    price_paise: 269900,  // ₹2,699
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['white', 'orange', 'black'],
    stock: 7,
    tags: ['running', 'long-distance', 'marathon', 'premium', 'floatride'],
  },
  {
    id: 'prod_006',
    name: 'Under Armour Charged Rogue 3',
    description: 'Versatile running shoe with Charged Cushioning midsole. Great for track workouts, casual runs, and gym sessions. Durable rubber outsole.',
    category: 'running-shoes',
    brand: 'Under Armour',
    price_paise: 239900,  // ₹2,399
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['black', 'red', 'grey'],
    stock: 9,
    tags: ['running', 'versatile', 'gym', 'track', 'charged-cushioning'],
  },
  {
    id: 'prod_007',
    name: 'New Balance Fresh Foam 1080v13',
    description: 'Ultra-plush running shoe with Fresh Foam X midsole for a supremely cushioned ride. Top pick for long runs and recovery days.',
    category: 'running-shoes',
    brand: 'New Balance',
    price_paise: 349900,  // ₹3,499
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['blue', 'black', 'white'],
    stock: 4,
    tags: ['running', 'plush', 'long-run', 'recovery', 'ultra-cushioned'],
  },
  {
    id: 'prod_008',
    name: 'ASICS Gel-Nimbus 25',
    description: 'Top-of-the-line neutral running shoe with gel cushioning for maximum shock absorption. Recommended for overpronators and high-mileage runners.',
    category: 'running-shoes',
    brand: 'ASICS',
    price_paise: 379900,  // ₹3,799
    sizes: ['7', '8', '9', '10'],
    colors: ['black', 'white', 'silver'],
    stock: 0,  // ← intentionally out of stock (failure case demo)
    tags: ['running', 'gel-cushioning', 'overpronation', 'high-mileage', 'neutral'],
  },

  // ─── CASUAL SNEAKERS ─────────────────────────────────────────────────────
  {
    id: 'prod_009',
    name: 'Nike Air Force 1 \'07',
    description: 'The iconic all-white leather sneaker. Timeless silhouette with Air-Sole unit for everyday cushioning. A wardrobe essential.',
    category: 'casual-sneakers',
    brand: 'Nike',
    price_paise: 799900,  // ₹7,999
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['white', 'black', 'triple-white'],
    stock: 15,
    tags: ['casual', 'iconic', 'leather', 'everyday', 'classic', 'streetwear'],
  },
  {
    id: 'prod_010',
    name: 'Adidas Superstar',
    description: 'Classic shell-toe sneaker with three stripes. Versatile street style icon since 1969. Leather upper with rubber outsole.',
    category: 'casual-sneakers',
    brand: 'Adidas',
    price_paise: 699900,  // ₹6,999
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['white-black', 'all-black', 'white-gold'],
    stock: 11,
    tags: ['casual', 'classic', 'shell-toe', 'three-stripes', 'streetwear'],
  },
  {
    id: 'prod_011',
    name: 'Puma Suede Classic XXI',
    description: 'Retro-inspired suede sneaker with softfoam comfort. A cult classic that transcends trends. Perfect for casual outings.',
    category: 'casual-sneakers',
    brand: 'Puma',
    price_paise: 499900,  // ₹4,999
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['navy-suede', 'red-suede', 'grey-suede'],
    stock: 8,
    tags: ['casual', 'suede', 'retro', 'classic', 'lifestyle'],
  },
  {
    id: 'prod_012',
    name: 'Skechers D\'Lites 4.0',
    description: 'Chunky-soled lifestyle sneaker with memory foam insole. Lightweight and comfortable for all-day wear. Lace-up with decorative side accents.',
    category: 'casual-sneakers',
    brand: 'Skechers',
    price_paise: 389900,  // ₹3,899
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['white-gold', 'black-silver', 'white-pink'],
    stock: 18,
    tags: ['casual', 'chunky', 'memory-foam', 'lifestyle', 'comfortable'],
  },
  {
    id: 'prod_013',
    name: 'Reebok Club C 85',
    description: 'Minimalist tennis-inspired sneaker with clean leather upper. A perennial favorite for clean, understated style.',
    category: 'casual-sneakers',
    brand: 'Reebok',
    price_paise: 459900,  // ₹4,599
    sizes: ['7', '8', '9', '10'],
    colors: ['white', 'chalk-white', 'black'],
    stock: 6,
    tags: ['casual', 'tennis', 'minimalist', 'leather', 'clean'],
  },
  {
    id: 'prod_014',
    name: 'Vans Old Skool',
    description: 'The iconic low-top waffle-sole sneaker with the signature side stripe. Born on the skatepark, now a global style icon.',
    category: 'casual-sneakers',
    brand: 'Vans',
    price_paise: 549900,  // ₹5,499
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black-white', 'navy-white', 'checkerboard'],
    stock: 14,
    tags: ['casual', 'skate', 'waffle-sole', 'icon', 'streetwear'],
  },
  {
    id: 'prod_015',
    name: 'Converse Chuck Taylor All Star',
    description: 'The original canvas sneaker. Over 100 years of style. High-top silhouette with rubber toe cap. Available in every color imaginable.',
    category: 'casual-sneakers',
    brand: 'Converse',
    price_paise: 399900,  // ₹3,999
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black', 'white', 'red', 'navy'],
    stock: 22,
    tags: ['casual', 'canvas', 'high-top', 'classic', 'all-star'],
  },
  {
    id: 'prod_016',
    name: 'New Balance 574',
    description: 'Heritage running-turned-lifestyle sneaker with ENCAP midsole technology. Suede and mesh upper with retro New Balance branding.',
    category: 'casual-sneakers',
    brand: 'New Balance',
    price_paise: 599900,  // ₹5,999
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['grey', 'navy', 'maroon'],
    stock: 0,  // ← out of stock (failure case)
    tags: ['casual', 'heritage', 'lifestyle', 'encap', 'retro'],
  },

  // ─── HIKING BOOTS ────────────────────────────────────────────────────────
  {
    id: 'prod_017',
    name: 'Woodland Waterproof Trekking Boot',
    description: 'Heavy-duty waterproof hiking boot with anti-skid rubber sole. Ideal for monsoon treks and rocky terrain. Nubuck leather upper with ankle support.',
    category: 'hiking-boots',
    brand: 'Woodland',
    price_paise: 499900,  // ₹4,999
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['brown', 'khaki', 'black'],
    stock: 10,
    tags: ['hiking', 'waterproof', 'trekking', 'nubuck', 'ankle-support'],
  },
  {
    id: 'prod_018',
    name: 'Quechua NH500 Mid Waterproof',
    description: 'Entry-level waterproof hiking shoe with mid-ankle support. Designed for nature hikes and walking trails. Excellent grip on wet and dry surfaces.',
    category: 'hiking-boots',
    brand: 'Quechua',
    price_paise: 399900,  // ₹3,999
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['khaki', 'blue-grey', 'black'],
    stock: 13,
    tags: ['hiking', 'waterproof', 'mid-ankle', 'trail', 'grip'],
  },
  {
    id: 'prod_019',
    name: 'Columbia Redmond V2',
    description: 'Versatile waterproof trail shoe with Techlite midsole for lightweight cushioning. Omni-Grip rubber outsole for superior traction on all terrains.',
    category: 'hiking-boots',
    brand: 'Columbia',
    price_paise: 679900,  // ₹6,799
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['dark-brown', 'tan', 'charcoal'],
    stock: 7,
    tags: ['hiking', 'trail', 'waterproof', 'omni-grip', 'lightweight'],
  },
  {
    id: 'prod_020',
    name: 'Salomon X Ultra 4 GTX',
    description: 'Premium Gore-Tex hiking shoe for demanding trails. Advanced Chassis technology for superior stability. Contagrip outsole for precise mountain traction.',
    category: 'hiking-boots',
    brand: 'Salomon',
    price_paise: 1299900,  // ₹12,999
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['magnet-black', 'blue-navy', 'green'],
    stock: 4,
    tags: ['hiking', 'gore-tex', 'premium', 'mountain', 'advanced', 'contagrip'],
  },
  {
    id: 'prod_021',
    name: 'Merrell Moab 3',
    description: 'The #1 best-selling hiking boot worldwide. Breathable mesh with suede leather upper. M-Select DRY waterproof lining and Vibram outsole for all-day comfort on trails.',
    category: 'hiking-boots',
    brand: 'Merrell',
    price_paise: 849900,  // ₹8,499
    sizes: ['7', '8', '9', '10', '11', '12'],
    colors: ['earth-brown', 'black', 'olive'],
    stock: 6,
    tags: ['hiking', 'bestseller', 'vibram', 'waterproof', 'all-day-comfort'],
  },
  {
    id: 'prod_022',
    name: 'Wildcraft Tundra Trekking Shoe',
    description: 'Indian-made waterproof trekking shoe with reinforced toe cap and ankle support. Built for the Himalayas. Affordable alternative to international brands.',
    category: 'hiking-boots',
    brand: 'Wildcraft',
    price_paise: 299900,  // ₹2,999
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['green', 'grey', 'black'],
    stock: 16,
    tags: ['hiking', 'trekking', 'affordable', 'indian-brand', 'himalayan'],
  },

  // ─── ADDITIONAL RUNNING (for search variety) ──────────────────────────────
  {
    id: 'prod_023',
    name: 'HRX by Hrithik Roshan RUN',
    description: 'Indian performance running shoe with EVA cushioning. Designed for daily training. Lightweight and breathable at an accessible price point.',
    category: 'running-shoes',
    brand: 'HRX',
    price_paise: 149900,  // ₹1,499
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: ['black-red', 'blue-white', 'grey'],
    stock: 25,
    tags: ['running', 'indian-brand', 'affordable', 'eva-cushioning', 'training'],
  },
  {
    id: 'prod_024',
    name: 'Campus Hurricane',
    description: 'Budget-friendly running shoe with PU sole and mesh upper. Great for light jogging and school sports. Available in a wide size range.',
    category: 'running-shoes',
    brand: 'Campus',
    price_paise: 99900,  // ₹999
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['white', 'blue', 'black'],
    stock: 30,
    tags: ['running', 'budget', 'jogging', 'school-sports', 'pu-sole'],
  },
  {
    id: 'prod_025',
    name: 'Brooks Ghost 15',
    description: 'Balanced, smooth-riding neutral running shoe with DNA LOFT v2 cushioning. A trusted daily trainer for all paces. Brooks flagship neutral shoe.',
    category: 'running-shoes',
    brand: 'Brooks',
    price_paise: 319900,  // ₹3,199
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['electric-blue', 'grey', 'black-red'],
    stock: 3,
    tags: ['running', 'neutral', 'daily-trainer', 'balanced', 'dna-loft'],
  },
];

const PRODUCTS = process.env.MERCHANT_CATEGORY === 'electronics'
  ? require('./seed-electronics').PRODUCTS_ELECTRONICS
  : FOOTWEAR_PRODUCTS;

function seedProducts() {
  const db = getDb();

  const existingCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (existingCount.count > 0) {
    console.log(`[Seed] Database already has ${existingCount.count} products. Skipping seed.`);
    return;
  }

  const insert = db.prepare(`
    INSERT INTO products (id, name, description, category, brand, price_paise, sizes, colors, stock, tags)
    VALUES (@id, @name, @description, @category, @brand, @price_paise, @sizes, @colors, @stock, @tags)
  `);

  const insertAll = db.transaction((products) => {
    for (const p of products) {
      insert.run({
        ...p,
        sizes: JSON.stringify(p.sizes),
        colors: JSON.stringify(p.colors),
        tags: JSON.stringify(p.tags),
      });
    }
  });

  insertAll(PRODUCTS);

  console.log(`[Seed] ✅ Seeded ${PRODUCTS.length} products into ${process.env.MERCHANT_NAME || 'merchant'} catalog.`);
  console.log('[Seed] Categories:');
  const cats = db.prepare("SELECT category, COUNT(*) as count FROM products GROUP BY category").all();
  cats.forEach(c => console.log(`  - ${c.category}: ${c.count} products`));

  const oos = PRODUCTS.filter(p => p.stock === 0);
  if (oos.length > 0) {
    console.log(`[Seed] Out-of-stock items: ${oos.map(p => p.name).join(', ')}`);
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts, PRODUCTS };

