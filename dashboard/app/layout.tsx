import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CatalogX — Agentic Commerce Dashboard',
  description: 'Real-time audit trail for AI-powered autonomous purchases. Built for Razorpay AI Buildathon Track 01.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
