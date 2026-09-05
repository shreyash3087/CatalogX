'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer, { CartItem } from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { FOOTWEAR_PRODUCTS, Product } from '@/lib/products';

const PRODUCT_COLORS: Record<number, string[]> = {
  0: ['#1a1a2e', '#e8e8e8'],
  1: ['#2d4a22', '#f0e6c8', '#1a3a5c'],
  2: ['#8B6914', '#333333', '#5a3e6e'],
  3: ['#4a6741', '#c8b89a', '#2a2a2a'],
  4: ['#1c3a5e', '#c8c8c8'],
  5: ['#2e2e2e', '#d4c8b0'],
};

// High quality Unsplash images for collections
const COLLECTION_DATA = [
  {
    title: 'Marathon & Road Running',
    category: 'running-shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85',
    price: 'From ₹1,499',
    desc: 'Ultra-light responsive foam for long miles and road speed.',
  },
  {
    title: 'Trail & Mountain Trekking',
    category: 'hiking-boots',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=85',
    price: 'From ₹2,999',
    desc: 'Waterproof Gore-Tex lining with heavy-duty rock grip outsoles.',
  },
  {
    title: 'Streetwear Lifestyle',
    category: 'casual-sneakers',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=85',
    price: 'From ₹3,899',
    desc: 'Timeless silhouettes in premium leather and canvas.',
  },
  {
    title: 'All-Terrain Athletics',
    category: 'running-shoes',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=85',
    price: 'From ₹999',
    desc: 'Cross-functional athletic shoes for track, court, and gym.',
  },
];

export default function UrbanStrideHomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('9');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [activeColorIdx, setActiveColorIdx] = useState<Record<number, number>>({});

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      setMouseOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('urbanstride_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try { localStorage.setItem('urbanstride_cart', JSON.stringify(newCart)); } catch (e) {}
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) { handleRemoveItem(index); return; }
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };
  const handleRemoveItem = (index: number) => saveCart(cart.filter((_, i) => i !== index));
  const handleClearCart = () => saveCart([]);

  const featured = FOOTWEAR_PRODUCTS.slice(0, 6);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '9');
    setIsModalOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] text-[#0f0f0f] font-sans selection:bg-[#0f0f0f] selection:text-[#F8F7F4]">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      {/* =============================================
          1. HERO SECTION — compact, fits in viewport
         ============================================= */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#EEECEA]"
        style={{ minHeight: 'calc(100vh - 88px)' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center h-full py-10 relative z-10">

          {/* Left: Text */}
          <div className="space-y-4 max-w-lg">
            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star text-[#0f0f0f] text-[11px]"></i>
                ))}
              </div>
              <span className="text-[11.5px] font-medium text-[#666]">4.9 / 320 Reviews</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-[52px] sm:text-[64px] lg:text-[72px] leading-[0.9] tracking-tight text-[#0f0f0f] uppercase">
              Discover<br />
              Comfort and<br />
              <span className="text-[#888]">Style for</span><br />
              Every Occasion
            </h1>

            {/* Description */}
            <p className="text-[12.5px] text-[#777] leading-relaxed max-w-sm">
              Discover the perfect balance of comfort, durability, and style for every occasion with our versatile, high-quality footwear collection.
            </p>

            {/* Testimonial card */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E0DDD9] max-w-[240px] shadow-sm">
              <div className="text-[11px] font-bold text-[#0f0f0f] mb-1">Comfort. Style. Versatility. Quality</div>
              <p className="text-[10.5px] text-[#888] leading-relaxed italic">
                &ldquo;These shoes offer incredible comfort and style. Perfect for every occasion, I wear them daily!&rdquo;
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-1">
              <Link href="/products" className="explore-pill">
                <span className="explore-pill-icon">
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
                Explore Collection
              </Link>
              <Link href="/#brands" className="text-[11.5px] font-bold text-[#666] hover:text-[#0f0f0f] transition-colors uppercase tracking-wide">
                View Brands &rarr;
              </Link>
            </div>
          </div>

          {/* Right: Floating Shoe with RUNNING watermark */}
          <div className="relative flex items-center justify-center" style={{ minHeight: '380px' }}>
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
              <span
                className="font-heading font-black uppercase text-[#0f0f0f] opacity-[0.04] whitespace-nowrap"
                style={{ fontSize: 'clamp(70px, 11vw, 150px)', letterSpacing: '-0.02em' }}
              >
                RUNNING
              </span>
            </div>

            <div
              className="relative z-10 transition-transform duration-100 ease-out"
              style={{ transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/urbanstride/hero_layer_1_shoes.png"
                alt="UrbanStride Hero Shoes"
                className="w-full max-w-[360px] sm:max-w-[460px] lg:max-w-[520px] h-auto object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.15)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          2. WE ARE BOLD — compact product grid
         ============================================= */}
      <section id="collections" className="py-12 bg-[#F8F7F4] relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute right-0 top-4 pointer-events-none select-none overflow-hidden w-full flex justify-end">
          <span className="watermark-text pr-4 opacity-30" style={{ fontSize: 'clamp(60px, 10vw, 140px)' }}>
            SNEAKERS
          </span>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 relative z-10">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
            <div className="space-y-2 max-w-sm">
              <h2 className="font-heading font-bold text-[40px] sm:text-[50px] leading-[0.95] tracking-tight text-[#0f0f0f] uppercase">
                We are Bold.
              </h2>
              <p className="text-[12.5px] text-[#777] leading-relaxed">
                Bold design, pushing boundaries, shoes that stand out. Each pair combines innovation, comfort, and style.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-heading font-black text-[34px] text-[#0f0f0f] leading-none">120+</div>
                <div className="text-[10.5px] text-[#999] mt-0.5">Happy Customers</div>
              </div>
              <div className="stat-divider" />
              <div className="text-center">
                <div className="font-heading font-black text-[34px] text-[#0f0f0f] leading-none">4.9/5</div>
                <div className="text-[10.5px] text-[#999] mt-0.5">Customer Rating</div>
              </div>
              <div className="stat-divider hidden sm:block" />
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-[#D0CEC9] rounded-full text-[11.5px] font-semibold text-[#666] hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-all"
              >
                Show More
              </Link>
            </div>
          </div>

          {/* Product Grid — 3 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p, idx) => {
              const colors = PRODUCT_COLORS[idx % 6] || ['#333', '#888'];
              const activeColor = activeColorIdx[idx] ?? 0;
              return (
                <div key={p.id} className="product-card group">
                  <div className="relative bg-[#EEECEA] rounded-xl overflow-hidden" style={{ height: '220px' }}>
                    <div className="badge-new">NEW</div>
                    <Link href={`/product/${p.id}`} className="flex items-center justify-center w-full h-full p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || '/assets/urbanstride/Shoe1.png'}
                        alt={p.name}
                        className="product-img max-h-[170px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                      />
                    </Link>
                    {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] border border-[#ccc] px-3 py-1 rounded-full bg-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 bg-[#F8F7F4]">
                    <Link href={`/product/${p.id}`}>
                      <h3 className="font-heading font-bold text-[16px] text-[#0f0f0f] uppercase leading-tight tracking-wide line-clamp-1 group-hover:opacity-60 transition-opacity">
                        {p.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="text-[12.5px] font-semibold text-[#0f0f0f]">
                        &#8377;{(p.price_paise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {colors.map((c, ci) => (
                          <button
                            key={ci}
                            onClick={() => setActiveColorIdx((prev) => ({ ...prev, [idx]: ci }))}
                            className={`color-dot ${activeColor === ci ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/products" className="btn-outline text-[12px]">
              View All Products &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* =============================================
          3. DRIVEN QUOTE
         ============================================= */}
      <section className="py-10 bg-[#EEECEA] border-t border-[#E0DDD9]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#bbb] mb-3">
            Discover Our Exquisite Solutions
          </div>
          <h2 className="font-heading font-bold text-[24px] sm:text-[30px] text-[#0f0f0f] max-w-xl mx-auto leading-tight">
            We are Driven. We collaborate with ambitious clients to create products that inspire action.
          </h2>
          <p className="text-[12px] text-[#888] mt-2.5 max-w-md mx-auto leading-relaxed">
            Driven work requires a focused mindset and a passion for excellence that goes beyond the ordinary.
          </p>
        </div>
      </section>

      {/* =============================================
          4. CURATED COLLECTIONS — Unsplash images
         ============================================= */}
      <section id="curated" className="py-12 bg-[#F8F7F4] border-t border-[#E0DDD9]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-heading font-bold text-[32px] sm:text-[40px] uppercase text-[#0f0f0f] leading-tight tracking-tight">
              Curated<br />Collections
            </h2>
            <Link href="/products" className="text-[11.5px] font-bold text-[#666] hover:text-[#0f0f0f] transition-colors uppercase tracking-wide hidden sm:block">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLLECTION_DATA.map((col, idx) => (
              <Link
                key={idx}
                href={`/products?category=${col.category}`}
                className="collection-card group block"
                style={{ height: '280px' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={col.image}
                  alt={col.title}
                  className="collection-img"
                  crossOrigin="anonymous"
                />
                <div className="collection-content-bottom">
                  <span className="text-[9.5px] font-semibold text-white/70 tracking-widest uppercase">
                    {col.price}
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-white uppercase tracking-wide mt-0.5 leading-tight">
                    {col.title}
                  </h3>
                  <div className="collection-hover-details">
                    <p className="text-[11px] text-white/75 leading-relaxed">{col.desc}</p>
                    <span className="inline-block mt-2 text-[10.5px] font-bold text-white uppercase tracking-wider border-b border-white/60 pb-0.5">
                      Explore Drops &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          5. BRAND PARTNERS — compact
         ============================================= */}
      <section id="brands" className="py-8 bg-[#EEECEA] border-t border-[#E0DDD9]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <div className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-[#bbb] mb-4">
            Authentic Authorized Retailer
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {['NIKE', 'ADIDAS', 'PUMA', 'NEW BALANCE', 'SKECHERS', 'SALOMON'].map((b) => (
              <div
                key={b}
                className="py-3 px-2 rounded-lg border border-[#D8D5D0] font-heading font-bold text-[13px] text-[#777] hover:text-[#0f0f0f] hover:border-[#aaa] transition-all cursor-default bg-[#F8F7F4]"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          6. SPLIT — WHY US + 15% OFF
         ============================================= */}
      <section id="about" className="w-full border-t border-[#E0DDD9]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Why Choose Us */}
          <div className="bg-[#F8F7F4] px-8 sm:px-12 py-10 sm:py-14 flex flex-col justify-center">
            <div className="max-w-md space-y-5">
              <div className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-[#bbb]">WHY CHOOSE US</div>
              <h2 className="font-heading font-bold text-[38px] sm:text-[46px] text-[#0f0f0f] uppercase leading-[0.95] tracking-tight">
                MORE THAN<br />JUST SNEAKERS
              </h2>
              <p className="text-[12.5px] text-[#777] leading-relaxed max-w-xs">
                We bring you the best quality, top brands and a seamless shopping experience.
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { icon: 'fa-solid fa-circle-check', title: 'Premium Quality', desc: 'Top grade materials' },
                  { icon: 'fa-regular fa-credit-card', title: 'Secure Payments', desc: '100% protected' },
                  { icon: 'fa-solid fa-headset', title: 'Customer Support', desc: "We're here to help" },
                  { icon: 'fa-regular fa-gem', title: 'Member Benefits', desc: 'Exclusive perks' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg border border-[#D0CEC9] flex items-center justify-center flex-shrink-0 bg-white">
                      <i className={`${item.icon} text-[12px] text-[#0f0f0f]`}></i>
                    </div>
                    <div>
                      <div className="text-[11.5px] font-bold text-[#0f0f0f]">{item.title}</div>
                      <div className="text-[10.5px] text-[#aaa]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/products" className="btn-dark inline-flex text-[11px]">
                Learn More <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </Link>
            </div>
          </div>

          {/* Right: Promo */}
          <div
            className="relative bg-cover bg-center px-8 sm:px-12 py-10 sm:py-14 flex flex-col justify-center min-h-[360px]"
            style={{ backgroundImage: "url('/assets/urbanstride/limited_offer_section_bg.png')" }}
          >
            <div className="absolute inset-0 bg-black/55 pointer-events-none" />
            <div className="relative z-10 max-w-md space-y-4">
              <div className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-white/50">LIMITED TIME OFFER</div>
              <h2 className="font-heading font-bold text-[38px] sm:text-[46px] text-white uppercase leading-[0.95] tracking-tight">
                GET 15% OFF<br />YOUR FIRST ORDER
              </h2>
              <p className="text-[12.5px] text-white/70 leading-relaxed max-w-sm">
                Join our community and unlock exclusive footwear drops and promotions.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you! Code STRIDE15 is now active for 15% off.');
                }}
                className="flex max-w-sm rounded-full overflow-hidden border border-white/25 bg-white/10 backdrop-blur-sm p-1"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="bg-transparent text-white px-3.5 py-2 text-[12px] placeholder-white/50 focus:outline-none flex-1 font-sans"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-[#F0ECEA] text-[#0f0f0f] font-bold text-[11px] uppercase tracking-wider transition-colors rounded-full cursor-pointer flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        selectedSize={selectedSize}
      />
    </div>
  );
}
