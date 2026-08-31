import type { Metadata } from 'next';
import Script from 'next/script';
import SmoothScroll from '@/components/SmoothScroll';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechCart Electronics — Precision Audio & Next-Gen Wearables',
  description: 'High-fidelity audio, studio-grade ANC, AMOLED displays and powerful computing gear. Experience seamless Razorpay checkout on TechCart.',
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
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
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
      <body className="bg-[#04060A] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
