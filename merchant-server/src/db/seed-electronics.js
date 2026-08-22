'use strict';

/**
 * CatalogX — TechCart Electronics Seed Data
 * Seeds 15 electronics products across categories (smartwatches, audio, computing).
 */

const PRODUCTS_ELECTRONICS = [
  // ─── AUDIO ──────────────────────────────────────────────────────────────
  {
    id: 'elec_001',
    name: 'boAt Rockerz 450 Pro',
    description: 'Wireless on-ear headphones with 70 hours playback and ASAP charge technology. Deep bass and comfortable earcups for prolonged listening.',
    category: 'electronics',
    brand: 'boAt',
    price_paise: 149900,  // ₹1,499 (Fits AUTO tier)
    sizes: ['onesize'],
    colors: ['black', 'blue', 'hazel-beige'],
    stock: 25,
    tags: ['headphones', 'wireless', 'bass', 'cheap', 'long-battery'],
  },
  {
    id: 'elec_002',
    name: 'OnePlus Nord Buds 2r',
    description: 'True wireless in-ear earbuds with 12.4.mm dynamic drivers and dual mic design for clear calls. IP55 water and sweat resistance.',
    category: 'electronics',
    brand: 'OnePlus',
    price_paise: 219900,  // ₹2,199 (Fits NOTIFY tier)
    sizes: ['onesize'],
    colors: ['grey', 'blue'],
    stock: 18,
    tags: ['earbuds', 'wireless', 'oneplus', 'tws', 'sweatproof'],
  },
  {
    id: 'elec_003',
    name: 'Sony WH-CH720N Noise Cancelling',
    description: 'Sony lightest wireless noise-cancelling overhead headphones. Equipped with Dual Noise Sensor technology and V1 processor.',
    category: 'electronics',
    brand: 'Sony',
    price_paise: 999000,  // ₹9,990 (Fits REJECT tier)
    sizes: ['onesize'],
    colors: ['black', 'blue', 'white'],
    stock: 6,
    tags: ['headphones', 'sony', 'noise-cancelling', 'premium', 'wireless'],
  },

  // ─── SMARTWATCHES ────────────────────────────────────────────────────────
  {
    id: 'elec_004',
    name: 'Noise ColorFit Pulse 3',
    description: 'Smart watch with 1.96" TFT display, Bluetooth calling, heart rate tracker, SpO2 sensor, and 150+ watch faces.',
    category: 'electronics',
    brand: 'Noise',
    price_paise: 139900,  // ₹1,399 (Fits AUTO tier)
    sizes: ['onesize'],
    colors: ['black', 'pink', 'silver'],
    stock: 0, // OUT OF STOCK for testing stock-out logic!
    tags: ['smartwatch', 'bluetooth-calling', 'fitness', 'cheap'],
  },
  {
    id: 'elec_005',
    name: 'Fire-Boltt Gladiator',
    description: '1.96" Bluetooth calling smartwatch with rotating crown, luxury metal finish, 123 sports modes, and voice assistant support.',
    category: 'electronics',
    brand: 'Fire-Boltt',
    price_paise: 249900,  // ₹2,499 (Fits NOTIFY tier — fallback for Noise smartwatch)
    sizes: ['onesize'],
    colors: ['black', 'gold', 'orange'],
    stock: 14,
    tags: ['smartwatch', 'calling', 'metal', 'luxury', 'assistant'],
  },
  {
    id: 'elec_006',
    name: 'Samsung Galaxy Watch 4 Classic',
    description: 'Premium smartwatch with physical rotating bezel, body composition analysis, sleep tracking, and Wear OS operating system.',
    category: 'electronics',
    brand: 'Samsung',
    price_paise: 449900,  // ₹4,499 (Fits CONFIRM tier)
    sizes: ['onesize'],
    colors: ['black', 'silver'],
    stock: 8,
    tags: ['smartwatch', 'samsung', 'wearos', 'premium', 'rotating-bezel'],
  },

  // ─── COMPUTING & ACCESSORIES ─────────────────────────────────────────────
  {
    id: 'elec_007',
    name: 'HP Wireless Keyboard & Mouse Combo 150',
    description: 'Ergonomic full-size keyboard and optical mouse combo. Simple plug-and-play setup with 2.4GHz wireless receiver.',
    category: 'electronics',
    brand: 'HP',
    price_paise: 129900,  // ₹1,299 (Fits AUTO tier)
    sizes: ['onesize'],
    colors: ['black'],
    stock: 22,
    tags: ['keyboard', 'mouse', 'wireless', 'hp', 'combo'],
  },
  {
    id: 'elec_008',
    name: 'Logitech Pebble Keys 2 K380s',
    description: 'Slim, lightweight multi-device Bluetooth keyboard. Easy switching between laptop, phone, and tablet.',
    category: 'electronics',
    brand: 'Logitech',
    price_paise: 299900,  // ₹2,999 (Fits NOTIFY tier)
    sizes: ['onesize'],
    colors: ['rose', 'sand', 'graphite'],
    stock: 11,
    tags: ['keyboard', 'bluetooth', 'multi-device', 'slim', 'logitech'],
  },
  {
    id: 'elec_009',
    name: 'Zebronics Max Pro Mechanical Keyboard',
    description: 'Premium mechanical gaming keyboard with tactile blue switches, 18 RGB light modes, and durable aluminum construction.',
    category: 'electronics',
    brand: 'Zebronics',
    price_paise: 349900,  // ₹3,499 (Fits CONFIRM tier)
    sizes: ['onesize'],
    colors: ['black'],
    stock: 9,
    tags: ['keyboard', 'mechanical', 'rgb', 'gaming', 'zebronics'],
  },
  {
    id: 'elec_010',
    name: 'SanDisk Ultra Dual Drive Luxe 128GB',
    description: 'All-metal 2-in-1 flash drive with USB Type-C and Type-A connectors. Fast read speeds up to 150MB/s.',
    category: 'electronics',
    brand: 'SanDisk',
    price_paise: 119900,  // ₹1,199 (Fits AUTO tier)
    sizes: ['onesize'],
    colors: ['silver'],
    stock: 45,
    tags: ['pendrive', 'usb-c', 'sandisk', 'metal', 'storage'],
  },
  {
    id: 'elec_011',
    name: 'Seagate Expansion 1TB Portable HDD',
    description: 'External portable hard drive with USB 3.0 drag-and-drop file saving. Lightweight companion for laptops and PCs.',
    category: 'electronics',
    brand: 'Seagate',
    price_paise: 489900,  // ₹4,899 (Fits CONFIRM tier)
    sizes: ['onesize'],
    colors: ['black'],
    stock: 7,
    tags: ['hard-disk', 'external', 'seagate', 'storage', 'backup'],
  },
  {
    id: 'elec_012',
    name: 'Apple iPad 9th Gen 64GB',
    description: '10.2-inch Retina display with True Tone, A13 Bionic chip, 8MP wide back camera, and 12MP ultra-wide front camera.',
    category: 'electronics',
    brand: 'Apple',
    price_paise: 2990000,  // ₹29,900 (Fits REJECT tier)
    sizes: ['onesize'],
    colors: ['space-grey', 'silver'],
    stock: 4,
    tags: ['tablet', 'ipad', 'apple', 'retina-display', 'a13'],
  },
  {
    id: 'elec_013',
    name: 'Lenovo IdeaPad Slim 3',
    description: 'Thin and light laptop with 15.6" FHD display, Intel Core i3 11th Gen, 8GB RAM, and 512GB SSD. Perfect for students and remote work.',
    category: 'electronics',
    brand: 'Lenovo',
    price_paise: 3399000,  // ₹33,990 (Fits REJECT tier)
    sizes: ['onesize'],
    colors: ['arctic-grey'],
    stock: 5,
    tags: ['laptop', 'lenovo', 'intel-i3', 'ssd', 'slim'],
  },
  {
    id: 'elec_014',
    name: 'Mi Smart Band 8 Active',
    description: 'Fitness tracker with 1.47" LCD display, 50+ sports modes, 14-day battery life, and 50m water resistance.',
    category: 'electronics',
    brand: 'Xiaomi',
    price_paise: 199900,  // ₹1,999 (Fits NOTIFY tier)
    sizes: ['onesize'],
    colors: ['black', 'blue'],
    stock: 30,
    tags: ['fitness-band', 'xiaomi', 'waterproof', 'cheap', 'long-battery'],
  },
  {
    id: 'elec_015',
    name: 'JBL Go 4 Bluetooth Speaker',
    description: 'Ultra-portable pocket-size speaker with punchy JBL Pro Sound. IP67 waterproof and dustproof, with up to 7 hours of playtime.',
    category: 'electronics',
    brand: 'JBL',
    price_paise: 319900,  // ₹3,199 (Fits CONFIRM tier)
    sizes: ['onesize'],
    colors: ['squad-camo', 'black', 'red'],
    stock: 15,
    tags: ['speaker', 'jbl', 'portable', 'waterproof', 'wireless'],
  }
];

module.exports = { PRODUCTS_ELECTRONICS };
