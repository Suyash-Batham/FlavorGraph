'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface IngredientDetail {
  name: string;
  description: string;
  category: string;
  flavors: string[];
  dishes: string[];
}

interface Pairing {
  name: string;
  category: string;
  strength: string;
  sharedFlavors: string[];
}

interface Bridge {
  ingredient: string;
  bridge: string;
  sharedFlavors: string[];
}

interface Dish {
  dish: string;
  cuisine: string;
  matched: string[];
}

interface PageData {
  ingredient: IngredientDetail;
  pairings: Pairing[];
  bridges: Bridge[];
  dishes: Dish[];
}

const STRENGTH_WIDTH: Record<string, string> = {
  strong: 'w-full',
  moderate: 'w-2/3',
  subtle: 'w-1/3',
};

const STRENGTH_COLOR: Record<string, string> = {
  strong: 'bg-amber-500',
  moderate: 'bg-amber-700',
  subtle: 'bg-stone-600',
};

export default function IngredientPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const decoded = decodeURIComponent(name);

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pairings/${encodeURIComponent(decoded)}`)
      .then(async (res) => {
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? 'Failed to load');
        setData(j);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [decoded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[var(--muted)]">
        <span className="animate-pulse">Loading flavor data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-16 border-red-900/50 bg-red-950/20">
        <p className="text-red-400 font-semibold mb-2">Could not load ingredient</p>
        <p className="text-[var(--muted)] text-sm mb-4">{error}</p>
        <Link href="/" className="text-[var(--accent)] text-sm hover:underline">← Back to all ingredients</Link>
      </div>
    );
  }

  if (!data) return null;
  const { ingredient, pairings, bridges, dishes } = data;

  const strongPairings = pairings.filter((p) => p.strength === 'strong');
  const otherPairings = pairings.filter((p) => p.strength !== 'strong');

  return (
    <div className="max-w-3xl">
      <Link href="/" className="text-[var(--muted)] text-sm hover:text-[var(--text)] transition-colors mb-6 inline-block">
        ← All ingredients
      </Link>

      {/* Hero */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">{ingredient.category}</p>
            <h1 className="text-3xl font-bold mb-2">{ingredient.name}</h1>
            <p className="text-[var(--muted)]">{ingredient.description}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Link
              href={`/path?from=${encodeURIComponent(decoded)}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)]
                         hover:bg-amber-900/20 transition-colors"
            >
              Find path from here →
            </Link>
          </div>
        </div>

        {ingredient.flavors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ingredient.flavors.map((f) => (
              <span key={f} className="badge badge-moderate">{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Strong pairings */}
      {strongPairings.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">
            Strong pairings ({strongPairings.length})
          </h2>
          <div className="grid gap-3">
            {strongPairings.map((p) => (
              <PairingCard key={p.name} pairing={p} />
            ))}
          </div>
        </section>
      )}

      {/* Other pairings */}
      {otherPairings.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">
            Also pairs with ({otherPairings.length})
          </h2>
          <div className="grid gap-2">
            {otherPairings.map((p) => (
              <PairingCard key={p.name} pairing={p} compact />
            ))}
          </div>
        </section>
      )}

      {/* 2-hop flavor bridges */}
      {bridges.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-1">
            Flavor bridges (2-hop)
          </h2>
          <p className="text-xs text-[var(--muted)] mb-3">
            Ingredients not directly paired, but connected via shared flavor profiles
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {bridges.slice(0, 12).map((b) => (
              <Link
                key={b.ingredient}
                href={`/ingredient/${encodeURIComponent(b.ingredient)}`}
                className="card p-3 hover:border-[var(--accent)] transition-colors"
              >
                <p className="font-medium text-sm">{b.ingredient}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">via {b.sharedFlavors.join(', ')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Dishes */}
      {dishes.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">
            Dishes using {ingredient.name}
          </h2>
          <div className="grid gap-2">
            {dishes.map((d) => (
              <div key={d.dish} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.dish}</p>
                  <p className="text-xs text-[var(--muted)]">{d.cuisine}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                  {d.matched.map((m) => (
                    <span key={m} className="badge badge-moderate">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PairingCard({ pairing, compact = false }: { pairing: Pairing; compact?: boolean }) {
  const width =
    pairing.strength === 'strong' ? 100 :
    pairing.strength === 'moderate' ? 66 : 33;

  return (
    <Link
      href={`/ingredient/${encodeURIComponent(pairing.name)}`}
      className={`card ${compact ? 'p-3' : 'p-4'} hover:border-[var(--accent)] transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>{pairing.name}</p>
        <span className={`badge badge-${pairing.strength}`}>{pairing.strength}</span>
      </div>
      <div className="strength-bar">
        <div
          className={`strength-bar-fill ${STRENGTH_COLOR[pairing.strength] ?? 'bg-stone-600'}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {pairing.sharedFlavors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pairing.sharedFlavors.map((f) => (
            <span key={f} className="badge badge-moderate">{f}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
