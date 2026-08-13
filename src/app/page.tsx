'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Ingredient {
  name: string;
  description: string;
  category: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Confectionery: '🍫',
  Beverage: '☕',
  Fruit: '🍓',
  Herb: '🌿',
  Spice: '🫙',
  Vegetable: '🍅',
  Dairy: '🧈',
  Fermented: '🫗',
  Oil: '🫒',
  Nut: '🌰',
  Paste: '🥣',
};

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = search ? `/api/ingredients?q=${encodeURIComponent(search)}` : '/api/ingredients';
      const res = await fetch(url);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Failed to load ingredients');
      }
      setIngredients(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchIngredients(q), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, fetchIngredients]);

  // Group by category
  const grouped = ingredients.reduce<Record<string, Ingredient[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3">
          What pairs with what?
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
          Explore ingredient pairings, discover 2-hop flavor bridges, and find the shortest
          path between any two ingredients — powered by a graph database.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md mx-auto">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">🔍</span>
        <input
          type="text"
          placeholder="Search ingredients…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]
                     text-[var(--text)] placeholder-[var(--muted)] outline-none
                     focus:border-[var(--accent)] transition-colors"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs animate-pulse">
            loading…
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-6 text-center mb-8 border-red-900/50 bg-red-950/20">
          <p className="text-red-400 font-medium mb-1">Database unavailable</p>
          <p className="text-[var(--muted)] text-sm">{error}</p>
          <p className="text-[var(--muted)] text-xs mt-2">
            Check your COGNODB_URI and COGNODB_PASSWORD in .env.local
          </p>
        </div>
      )}

      {/* Ingredient grid, grouped by category */}
      {!loading && !error && Object.keys(grouped).length === 0 && (
        <p className="text-center text-[var(--muted)] py-16">No ingredients found for "{q}"</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">
            {CATEGORY_EMOJI[category] ?? '•'} {category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((ing) => (
              <Link
                key={ing.name}
                href={`/ingredient/${encodeURIComponent(ing.name)}`}
                className="card p-4 hover:border-[var(--accent)] transition-colors group"
              >
                <p className="font-semibold group-hover:text-[var(--accent-light)] transition-colors">
                  {ing.name}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{ing.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
