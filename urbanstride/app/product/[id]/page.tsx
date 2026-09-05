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
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const found = FOOTWEAR_PRODUCTS.find((p) => p.id === id) || FOOTWEAR_PRODUCTS[0];
    setProduct(found);
    if (found.sizes && found.sizes.length > 0) setSelectedSize(found.sizes[0]);
  }, [id]);

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

  const handleAddToCart = () => {
    if (!product) return;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id && item.size === selectedSize);
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
    if (newQty <= 0) { handleRemoveItem(index); return; }
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const handleRemoveItem = (index: number) => saveCart(cart.filter((_, i) => i !== index));
  const handleClearCart = () => saveCart([]);

  if (!product) return null;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Thumbnail images (use product image + shoe assets for variety)
  const thumbnails = [
    product.image || '/assets/urbanstride/Shoe1.png',
    '/assets/urbanstride/Shoe2.png',
    '/assets/urbanstride/Shoe3.png',
    '/assets/urbanstride/Shoe4.png',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] text-[#0f0f0f] font-sans selection:bg-[#0f0f0f] selection:text-[#F8F7F4]">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-8 pt-7 pb-16">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[11.5px] font-medium text-[#aaa]">
          <Link href="/" className="hover:text-[#555] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#555] transition-colors">Sneakers</Link>
          <span>/</span>
          <span className="text-[#0f0f0f] font-semibold truncate">{product.name}</span>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="relative bg-[#EEECEA] rounded-2xl overflow-hidden flex items-center justify-center min-h-[460px] md:min-h-[540px] group">
              {/* Status */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                  product.stock > 0
                    ? 'bg-white text-emerald-700 border-emerald-200'
                    : 'bg-white text-rose-600 border-rose-200'
                }`}>
                  {product.stock > 0 ? `In Stock · ${product.stock} left` : 'Out of Stock'}
                </span>
              </div>
              {/* Brand badge */}
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-white border border-[#E0DDD9] text-[11px] font-bold uppercase tracking-wider text-[#555]">
                {product.brand}
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnails[activeImg]}
                alt={product.name}
                className="max-h-[380px] md:max-h-[440px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03] drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
              />
            </div>

            {/* Thumbnail Row */}
            <div className="flex gap-3">
              {thumbnails.map((thumb, ti) => (
                <button
                  key={ti}
                  onClick={() => setActiveImg(ti)}
                  className={`w-[80px] h-[80px] rounded-xl bg-[#EEECEA] flex items-center justify-center overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImg === ti ? 'border-[#0f0f0f]' : 'border-transparent hover:border-[#D0CEC9]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" className="max-h-16 w-auto object-contain" />
                </button>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: 'fa-solid fa-shield-check', title: '100% Authentic', sub: 'Sourced Direct' },
                { icon: 'fa-solid fa-truck-fast', title: 'Free Delivery', sub: 'Express Shipping' },
                { icon: 'fa-solid fa-rotate-left', title: '7-Day Return', sub: 'Hassle Free' },
              ].map((b) => (
                <div key={b.title} className="p-3.5 rounded-xl bg-white border border-[#E8E6E2] text-center space-y-1">
                  <i className={`${b.icon} text-[#0f0f0f] text-[16px]`}></i>
                  <div className="text-[11.5px] font-bold text-[#0f0f0f]">{b.title}</div>
                  <div className="text-[10px] text-[#999]">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-5 space-y-6 lg:pt-2">
            {/* Brand + Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11.5px] font-bold uppercase tracking-widest text-[#999]">
                {product.brand} · {product.category.replace('-', ' ')}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#0f0f0f" stroke="#0f0f0f" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
                <span className="text-[11px] text-[#777] ml-1">{product.rating || '4.9'} (128 reviews)</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="font-heading font-extrabold text-[38px] sm:text-[46px] lg:text-[50px] text-[#0f0f0f] tracking-tight uppercase leading-[0.9]">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-bold font-mono text-[#0f0f0f]">
                ₹{(product.price_paise / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[16px] font-mono text-[#bbb] line-through">
                ₹{((product.price_paise * 1.4) / 100).toLocaleString('en-IN')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                30% OFF
              </span>
            </div>
            <p className="text-[11.5px] text-[#aaa] -mt-3">Taxes included. Free express shipping on this order.</p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#E0DDD9]" />

            {/* Description */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Overview</div>
              <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#555] font-normal">
                {product.description}
              </p>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#0f0f0f]">UK / India Size</span>
                <span className="text-[11px] text-[#aaa]">True to size</span>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-14 h-12 rounded-xl text-[12px] font-bold border-2 transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-[#0f0f0f] text-white border-[#0f0f0f] scale-105'
                        : 'bg-white border-[#D8D5D0] text-[#555] hover:border-[#0f0f0f]'
                    }`}
                  >
                    UK {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#0f0f0f] block">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#D8D5D0] rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#555] hover:text-[#0f0f0f] hover:bg-[#F8F7F4] transition-colors cursor-pointer font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-[14px] text-[#0f0f0f]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#555] hover:text-[#0f0f0f] hover:bg-[#F8F7F4] transition-colors cursor-pointer font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-[12px] text-[#aaa]">Pair(s)</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-4 px-8 rounded-2xl text-[14px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 ${
                addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white active:scale-[0.99]'
              }`}
            >
              {addedAnimation ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Added to Bag!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  Add to Bag — ₹{((product.price_paise * quantity) / 100).toLocaleString('en-IN')}
                </>
              )}
            </button>

            {/* Misc info */}
            <div className="flex items-center gap-3 pt-1 text-[11.5px] text-[#aaa]">
              <span>Free returns within 7 days</span>
              <span>·</span>
              <span>Secure checkout</span>
              <span>·</span>
              <Link href="/products" className="text-[#555] hover:text-[#0f0f0f] transition-colors">View all brands</Link>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-20 pt-10 border-t border-[#E0DDD9]">
          <h2 className="font-heading font-bold text-[36px] sm:text-[42px] text-[#0f0f0f] uppercase tracking-tight mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {FOOTWEAR_PRODUCTS.filter((p) => p.id !== id).slice(0, 4).map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="product-card group block">
                <div className="bg-[#EEECEA] rounded-xl overflow-hidden flex items-center justify-center p-5" style={{ height: '180px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || '/assets/urbanstride/Shoe1.png'}
                    alt={p.name}
                    className="product-img max-h-[140px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
                  />
                </div>
                <div className="p-3.5 bg-[#F8F7F4]">
                  <div className="text-[10px] text-[#aaa] uppercase tracking-wider font-semibold mb-0.5">{p.brand}</div>
                  <h4 className="font-heading font-bold text-[15px] text-[#0f0f0f] uppercase leading-tight line-clamp-1">
                    {p.name}
                  </h4>
                  <div className="text-[12.5px] font-semibold text-[#0f0f0f] mt-1.5">
                    ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />

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
