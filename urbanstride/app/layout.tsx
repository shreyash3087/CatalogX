import type { Metadata } from 'next';
import Script from 'next/script';
import SmoothScroll from '@/components/SmoothScroll';
import './globals.css';

export const metadata: Metadata = {
  title: 'UrbanStride Footwear — Premium Performance Running & Trail Shoes',
  description: 'Premium sneakers crafted for comfort, style and performance. Discover curated collections and seamless Razorpay checkout.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <Script
          src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#080B11] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-white selection:text-black">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
