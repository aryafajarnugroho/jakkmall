import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JakMall to Shopee Listing Automation | PoC',
  description: 'Ekstraksi otomatis katalog JakMall dan penerbitan produk ke Shopee Seller Center.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full bg-slate-900 text-slate-100">
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
