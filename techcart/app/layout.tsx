import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechCart Electronics — Smart Audio, Mechanical Keyboards & Smartwatches',
  description: 'Next-gen computing accessories, wireless audio, and wearables with autonomous CatalogX Agentic Checkout integration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
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
      <body className="antialiased bg-[#06080F] text-slate-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
