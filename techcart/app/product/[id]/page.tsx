'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechCartCartDrawer, { CartItem } from '@/components/CartDrawer';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

/* Inline SVG Icons */
function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#C67D3A" stroke="#C67D3A" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function BagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function TechCartDynamicProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    const found = ELECTRONICS_PRODUCTS.find((p) => p.id === id) || ELECTRONICS_PRODUCTS[0];
    setProduct(found);
    if (found?.colors && found.colors.length > 0) {
      setSelectedColor(found.colors[0]);
    }
  }, [id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('techcart_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('techcart_cart', JSON.stringify(newCart));
    } catch (e) {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [...cart, { product, quantity }];
    }

    saveCart(updatedCart);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  if (!product) return null;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const relatedProducts = ELECTRONICS_PRODUCTS.filter((p) => p.id !== id).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#0C1220] font-sans">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 sm:px-8 pt-7 pb-16">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[11.5px] font-medium text-[#9C9589]">
          <Link href="/" className="hover:text-[#5A5549] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#5A5549] transition-colors">Hardware</Link>
          <span>/</span>
          <span className="text-[#0C1220] font-semibold truncate">{product.name}</span>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="relative bg-[#F5F0E8] rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] md:min-h-[500px] p-8 group">
              {/* Status badges */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                  product.stock > 0
                    ? 'bg-white text-emerald-700 border-emerald-200'
                    : 'bg-white text-red-600 border-red-200'
                }`}>
                  {product.stock > 0 ? `In Stock -- ${product.stock} left` : 'Out of Stock'}
                </span>
              </div>
              {/* Brand badge */}
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-white border border-[#E8E0D4] text-[11px] font-bold uppercase tracking-wider text-[#5A5549]">
                {product.brand}
              </div>

              {/* Product Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image || '/assets/techcart/headphones.jpg'}
                alt={product.name}
                className="max-h-[340px] md:max-h-[400px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03] drop-shadow-[0_20px_40px_rgba(12,18,32,0.08)]"
              />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <ShieldIcon />, title: '1-Year Warranty', sub: 'Zero-Hassle Replacement' },
                { icon: <TruckIcon />, title: 'Express Delivery', sub: 'Tracked Air Dispatch' },
                { icon: <RotateIcon />, title: '7-Day Return', sub: '100% Refund Policy' },
              ].map((b) => (
                <div key={b.title} className="p-3.5 rounded-xl bg-white border border-[#E8E0D4] text-center space-y-1">
                  <div className="flex justify-center text-[#C67D3A]">{b.icon}</div>
                  <div className="text-[11.5px] font-bold text-[#0C1220]">{b.title}</div>
                  <div className="text-[10px] text-[#9C9589]">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-5 space-y-6 lg:pt-2">
            {/* Brand + Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11.5px] font-bold uppercase tracking-widest text-[#9C9589]">
                {product.brand}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
                <span className="text-[11px] text-[#9C9589] ml-1">{product.rating || '4.8'} ({product.reviews_count || '120'} reviews)</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="font-heading font-extrabold text-[34px] sm:text-[42px] lg:text-[46px] text-[#0C1220] tracking-tight uppercase leading-[0.92]">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-bold font-mono text-[#0C1220]">
                {'\u20B9'}{(product.price_paise / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[16px] font-mono text-[#B0A99E] line-through">
                {'\u20B9'}{((product.price_paise * 1.35) / 100).toLocaleString('en-IN')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                25% OFF
              </span>
            </div>
            <p className="text-[11.5px] text-[#B0A99E] -mt-3">Inclusive of all taxes. Free express shipping applied at checkout.</p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#E8E0D4]" />

            {/* Description */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9C9589]">Architecture &amp; Features</div>
              <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#5A5549] font-normal">
                {product.description}
              </p>
            </div>

            {/* Colors (if available) */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#0C1220]">
                  Select Finish: <span className="text-[#C67D3A] capitalize">{selectedColor}</span>
                </div>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] capitalize border-2 transition-all cursor-pointer ${
                        selectedColor === c
                          ? 'bg-[#0C1220] text-white border-[#0C1220] font-bold'
                          : 'bg-white border-[#E8E0D4] text-[#5A5549] hover:border-[#0C1220]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#0C1220] block">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#E8E0D4] rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#5A5549] hover:text-[#0C1220] hover:bg-[#F5F0E8] transition-colors cursor-pointer font-bold text-lg"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-[14px] text-[#0C1220]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#5A5549] hover:text-[#0C1220] hover:bg-[#F5F0E8] transition-colors cursor-pointer font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-[12px] text-[#9C9589]">Unit(s)</span>
              </div>
            </div>

            {/* Add to Bag Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-4 px-8 rounded-2xl text-[14px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 ${
                addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#0C1220] hover:bg-[#1a2436] text-white active:scale-[0.99]'
              }`}
            >
              {addedAnimation ? (
                <>
                  <CheckIcon />
                  <span>Added to Hardware Bag</span>
                </>
              ) : (
                <>
                  <BagIcon />
                  <span>Add to Bag -- {'\u20B9'}{((product.price_paise * quantity) / 100).toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            {/* Misc info */}
            <div className="flex items-center gap-3 pt-1 text-[11.5px] text-[#9C9589]">
              <span>Verified Hardware</span>
              <span>·</span>
              <span>100% Genuine</span>
              <span>·</span>
              <Link href="/products" className="text-[#C67D3A] hover:underline">All Products</Link>
            </div>
          </div>
        </div>

        {/* Related Hardware Section */}
        <div className="mt-20 pt-10 border-t border-[#E8E0D4]">
          <h2 className="font-heading font-extrabold text-[28px] sm:text-[36px] text-[#0C1220] uppercase tracking-tight mb-8">
            Explore Related Hardware
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="tc-card group block">
                <div className="bg-[#F5F0E8] rounded-t-2xl p-4 flex items-center justify-center h-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || '/assets/techcart/headphones.jpg'}
                    alt={p.name}
                    className="tc-card-img max-h-24 w-auto object-contain"
                  />
                </div>
                <div className="p-3.5 bg-white rounded-b-2xl">
                  <div className="text-[9.5px] font-mono font-bold uppercase text-[#C67D3A] mb-0.5">{p.brand}</div>
                  <h4 className="font-heading font-bold text-[13.5px] text-[#0C1220] uppercase line-clamp-1 group-hover:text-[#C67D3A] transition-colors">
                    {p.name}
                  </h4>
                  <div className="text-[12.5px] font-semibold text-[#0C1220] mt-1.5">
                    {'\u20B9'}{(p.price_paise / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <TechCartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}