import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminNavbar from '@/components/AdminNavbar';
import ColdStartBanner from '@/components/ColdStartBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NestJS + Prisma Admin Dashboard',
  description: 'Admin Console for managing users (View, Add, Delete) via NestJS 10 + Prisma',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased flex flex-col`}>
        <AdminAuthProvider>
          <ColdStartBanner />
          <AdminNavbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
            <p>Admin Dashboard &bull; NestJS 10 + Prisma 5.22 + PostgreSQL</p>
          </footer>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
