import type { Metadata } from 'next';
import Script from 'next/script';
import SmoothScroll from '@/components/SmoothScroll';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechCart -- Premium Audio & Computing Gear',
  description: 'Studio-grade headphones, wireless earbuds, mechanical keyboards, and AMOLED smartwatches. Secure Razorpay checkout with express delivery across India.',
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
      <body className="bg-[#FDFBF7] text-[#0C1220] font-sans antialiased overflow-x-hidden selection:bg-[#C67D3A] selection:text-white">
        <AuthProvider>
          <SmoothScroll />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
