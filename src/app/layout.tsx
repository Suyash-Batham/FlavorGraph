import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flavor Graph — Ingredient Pairing Explorer',
  description: 'Discover what pairs with what, explore flavor bridges, and find your next dish.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🍫</span>
              <span className="font-semibold text-lg tracking-tight">Flavor Graph</span>
            </a>
            <nav className="flex gap-6 text-sm text-[var(--muted)]">
              <a href="/" className="hover:text-[var(--text)] transition-colors">Explore</a>
              <a href="/path" className="hover:text-[var(--text)] transition-colors">Path Finder</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
