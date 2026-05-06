import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Honeycomb — Comms Dashboard',
  description: 'Internal issuer communications planning dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-stone-950 text-stone-100 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
