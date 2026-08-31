'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer, { CartItem } from '@/components/CartDrawer';
import { FOOTWEAR_PRODUCTS, Product } from '@/lib/products';

export default function UrbanStrideDynamicProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('9');
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Load product data
  useEffect(() => {
    const found = FOOTWEAR_PRODUCTS.find((p) => p.id === id) || FOOTWEAR_PRODUCTS[0];
    setProduct(found);
    if (found.sizes && found.sizes.length > 0) {
      setSelectedSize(found.sizes[0]);
    }
  }, [id]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('urbanstride_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('urbanstride_cart', JSON.stringify(newCart));
    } catch (e) {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.size === selectedSize
    );

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [...cart, { product, size: selectedSize, quantity }];
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

  return (
    <div className="flex flex-col min-h-screen bg-[#080B11] text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 pt-28 pb-24">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs font-medium text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/products" className="hover:text-white transition-colors">Sneakers</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold truncate">{product.name}</span>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Product Image Stage & Trust Badges */}
          <div className="lg:col-span-6 space-y-5">
            <div className="relative rounded-3xl bg-[#0E121B] border border-white/10 overflow-hidden p-10 sm:p-14 flex items-center justify-center min-h-[420px] md:min-h-[500px] shadow-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image || '/assets/urbanstride/Shoe1.png'}
                alt={product.name}
                className="max-h-[340px] md:max-h-[400px] w-auto object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_25px_45px_rgba(0,0,0,0.9)]"
              />

              {/* Clean Stock Status Badge */}
              <div className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-2 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
              </div>

              {/* Brand Tag */}
              <div className="absolute top-5 right-5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider bg-white/10 text-white border border-white/15 uppercase backdrop-blur-md">
                {product.brand}
              </div>
            </div>

            {/* 3 Trust Badges */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 text-center space-y-1">
                <i className="fa-solid fa-shield-check text-blue-400 text-base"></i>
                <div className="text-xs font-bold text-white">100% Authentic</div>
                <div className="text-[10px] text-slate-400">Sourced Direct</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 text-center space-y-1">
                <i className="fa-solid fa-truck-fast text-blue-400 text-base"></i>
                <div className="text-xs font-bold text-white">Free Delivery</div>
                <div className="text-[10px] text-slate-400">Express Shipping</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 text-center space-y-1">
                <i className="fa-solid fa-rotate-left text-blue-400 text-base"></i>
                <div className="text-xs font-bold text-white">7-Day Return</div>
                <div className="text-[10px] text-slate-400">Hassle Free</div>
              </div>
            </div>
          </div>

          {/* Right: Product Information & Purchase Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400">
                  {product.brand} · {product.category.replace('-', ' ')}
                </span>
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-star text-[10px]"></i>
                  <span>{product.rating || '4.9'} (128 reviews)</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight uppercase mt-1 leading-none">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3.5 mt-4">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-white">
                  ₹{(product.price_paise / 100).toLocaleString('en-IN')}
                </span>
                <span className="text-base font-mono text-slate-500 line-through">
                  ₹{((product.price_paise * 1.4) / 100).toLocaleString('en-IN')}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  30% OFF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Taxes included. Free express shipping on this order.</p>
            </div>

            {/* Overview / Description */}
            <div className="space-y-2 border-t border-b border-white/10 py-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Overview</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-normal">
                {product.description}
              </p>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-white font-mono">Select UK / India Size</span>
                <span className="text-slate-400 font-mono text-[11px]">True to size</span>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-14 h-12 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105'
                        : 'bg-[#121620] border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    UK {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono block">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-white/15 rounded-xl bg-[#0E121B] overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">Pair(s)</span>
              </div>
            </div>

            {/* Prominent Single ADD TO BAG Button */}
            <div className="pt-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-heading font-bold text-base uppercase tracking-wider shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40"
              >
                <i className="fa-solid fa-bag-shopping text-base"></i>
                <span>{addedAnimation ? 'ADDED TO BAG! ✓' : `ADD TO BAG — ₹${((product.price_paise * quantity) / 100).toLocaleString('en-IN')}`}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Slide-Over Shopping Bag Drawer */}
      <CartDrawer
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
