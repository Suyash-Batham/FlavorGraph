'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface PathResult {
  path: string[];
  hops: number;
}

interface Ingredient {
  name: string;
  category: string;
}

function PathFinderContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const [from, setFrom] = useState(sp.get('from') ?? '');
  const [to, setTo] = useState('');
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeValue = activeField === 'from' ? from : to;

  useEffect(() => {
    if (!activeValue || activeValue.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/ingredients?q=${encodeURIComponent(activeValue)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(t);
  }, [activeValue]);

  async function findPath() {
    if (!from || !to) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);
    try {
      const res = await fetch(`/api/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const j = await res.json();
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(j.error ?? 'Failed');
      setResult(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function pickSuggestion(name: string) {
    if (activeField === 'from') setFrom(name);
    else setTo(name);
    setSuggestions([]);
    setActiveField(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-[var(--muted)] text-sm hover:text-[var(--text)] transition-colors mb-6 inline-block">
        ← All ingredients
      </Link>

      <h1 className="text-3xl font-bold mb-2">Flavor Path Finder</h1>
      <p className="text-[var(--muted)] mb-8">
        Find the shortest pairing path between any two ingredients.{' '}
        <span className="text-xs">Uses Cypher's <code className="bg-stone-800 px-1 py-0.5 rounded">shortestPath()</code> —
        a multi-hop traversal that would require recursive CTEs in SQL.</span>
      </p>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {(['from', 'to'] as const).map((field) => (
            <div key={field} className="relative">
              <label className="block text-xs text-[var(--muted)] uppercase tracking-widest mb-1.5">
                {field === 'from' ? 'Start' : 'End'}
              </label>
              <input
                type="text"
                value={field === 'from' ? from : to}
                onChange={(e) => {
                  field === 'from' ? setFrom(e.target.value) : setTo(e.target.value);
                  setActiveField(field);
                }}
                onFocus={() => setActiveField(field)}
                placeholder={field === 'from' ? 'e.g. Dark Chocolate' : 'e.g. Lemon'}
                className="w-full px-4 py-2.5 rounded-lg bg-[#111] border border-[var(--border)]
                           text-[var(--text)] placeholder-[var(--muted)] outline-none
                           focus:border-[var(--accent)] transition-colors"
              />
              {activeField === field && suggestions.length > 0 && (
                <ul className="absolute z-10 top-full mt-1 w-full bg-[#1a1815] border border-[var(--border)]
                               rounded-lg overflow-hidden shadow-xl">
                  {suggestions.map((s) => (
                    <li key={s.name}>
                      <button
                        onMouseDown={() => pickSuggestion(s.name)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                      >
                        {s.name}
                        <span className="text-[var(--muted)] ml-2 text-xs">{s.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={findPath}
          disabled={!from || !to || loading}
          className="w-full py-3 rounded-lg bg-amber-600 text-white font-semibold
                     hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching…' : 'Find Shortest Path'}
        </button>
      </div>

      {/* Result */}
      {error && (
        <div className="card p-5 border-red-900/50 bg-red-950/20 text-red-400 text-sm">{error}</div>
      )}

      {notFound && (
        <div className="card p-6 text-center text-[var(--muted)]">
          No flavor path found between <strong className="text-[var(--text)]">{from}</strong> and{' '}
          <strong className="text-[var(--text)]">{to}</strong>.
          <p className="text-xs mt-2">These ingredients exist in separate flavor clusters.</p>
        </div>
      )}

      {result && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[var(--muted)] text-sm">{result.hops} hop{result.hops !== 1 ? 's' : ''}</span>
            <span className="text-[var(--muted)]">·</span>
            <span className="text-[var(--muted)] text-sm">{result.path.length} ingredients</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {result.path.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <Link
                  href={`/ingredient/${encodeURIComponent(step)}`}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-90
                    ${i === 0 || i === result.path.length - 1
                      ? 'bg-amber-600 text-white'
                      : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text)]'
                    }`}
                >
                  {step}
                </Link>
                {i < result.path.length - 1 && (
                  <span className="text-[var(--muted)]">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-4">
            Each arrow represents a direct PAIRS_WITH relationship. Click any ingredient to explore it.
          </p>
        </div>
      )}

      {/* Example searches */}
      {!result && !loading && (
        <div className="mt-6">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">Try these</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Dark Chocolate', 'Lemon'],
              ['Miso', 'Raspberry'],
              ['Tahini', 'Vanilla'],
              ['Espresso', 'Strawberry'],
            ].map(([f, t]) => (
              <button
                key={`${f}-${t}`}
                onClick={() => { setFrom(f); setTo(t); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)]
                           text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
              >
                {f} → {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PathPage() {
  return (
    <Suspense>
      <PathFinderContent />
    </Suspense>
  );
}
