import { useState, useEffect, useRef, useCallback } from 'react';
import { searchMemory } from '../api';
import Spinner    from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';

const DEBOUNCE_MS   = 350;
const SNIPPET_LIMIT = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return isNaN(d) ? ts : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function scoreColor(score) {
  if (score >= 0.8) return 'bg-emerald-500';
  if (score >= 0.5) return 'bg-amber-400';
  return 'bg-rose-400';
}
function scoreText(score) {
  if (score >= 0.8) return 'text-emerald-600';
  if (score >= 0.5) return 'text-amber-600';
  return 'text-rose-500';
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="h-3 w-2/3 bg-gray-100 rounded-full" />
        <div className="h-3 w-12 bg-gray-100 rounded-full shrink-0" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded-full" />
        <div className="h-3 bg-gray-100 rounded-full w-5/6" />
        <div className="h-3 bg-gray-100 rounded-full w-4/6" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-32 bg-gray-100 rounded-full" />
        <div className="h-2.5 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory result card
// ---------------------------------------------------------------------------
function MemoryCard({ item }) {
  const [expanded, setExpanded] = useState(false);

  const content       = item.content ?? item.text ?? JSON.stringify(item);
  const isTruncatable = content.length > SNIPPET_LIMIT;
  const snippet       = isTruncatable && !expanded
    ? content.slice(0, SNIPPET_LIMIT).trimEnd() + '…'
    : content;

  const score     = item.score ?? item.relevance ?? null;
  const scorePct  = score != null ? Math.round(score * 100) : null;
  const sessionId = item.session_id ?? item.sessionId ?? null;
  const timestamp = item.timestamp ?? item.created_at ?? null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm
      transition-shadow duration-200 hover:shadow-md hover:border-indigo-100">

      {/* Top row */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        {sessionId && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium
            text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            {sessionId}
          </span>
        )}
        {timestamp && (
          <span className="text-xs text-gray-400 ml-auto shrink-0">
            {formatTimestamp(timestamp)}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
        {snippet}
      </p>
      {isTruncatable && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {expanded ? '↑ Show less' : '↓ Show more'}
        </button>
      )}

      {/* Relevance bar */}
      {scorePct != null && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-400 shrink-0 w-20">Relevance</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${scoreColor(score)} transition-all duration-500`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className={`text-xs font-semibold shrink-0 w-8 text-right ${scoreText(score)}`}>
            {scorePct}%
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Memory() {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults(null); setError(null); return; }

    setLoading(true);
    setError(null);
    setLastQuery(trimmed);

    const data = await searchMemory(trimmed);
    setLoading(false);

    if (data.error) { setError(data.error); return; }

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
        ? data.results
        : [];
    setResults(items);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), DEBOUNCE_MS);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { clearTimeout(debounceRef.current); runSearch(query); }
    if (e.key === 'Escape') { clearTimeout(debounceRef.current); setQuery(''); setResults(null); setError(null); }
  };

  const handleClear = () => {
    clearTimeout(debounceRef.current);
    setQuery(''); setResults(null); setError(null);
    inputRef.current?.focus();
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const showSkeletons = loading;
  const showError     = !loading && !!error;
  const showEmpty     = !loading && !error && results === null;
  const showNoResults = !loading && !error && Array.isArray(results) && results.length === 0;
  const showResults   = !loading && !error && Array.isArray(results) && results.length > 0;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Memory"
        subtitle="Semantic search across everything the assistant has stored."
      />

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading
            ? <Spinner size="md" color="text-indigo-500" />
            : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
                strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
            )
          }
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search memory… (Enter to search instantly, Esc to clear)"
          className="w-full pl-11 pr-11 py-3.5 text-sm bg-white border border-gray-200 rounded-2xl
            shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
            focus:border-transparent transition-shadow"
        />

        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300
              hover:text-gray-500 transition-colors"
            title="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Result count */}
      {showResults && (
        <p className="text-xs text-gray-400 mb-4">
          {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium text-gray-600">"{lastQuery}"</span>
        </p>
      )}

      {/* States */}
      {showEmpty && (
        <EmptyState
          icon="🧠"
          title="Search your memory"
          description="Type a query above to find relevant context the assistant has stored."
        />
      )}
      {showError && (
        <ErrorState
          title="Search failed"
          message={error}
          onRetry={() => runSearch(lastQuery)}
        />
      )}
      {showNoResults && (
        <EmptyState
          icon="🔍"
          title="No results found"
          description={`Nothing in memory matches "${lastQuery}". Try different keywords.`}
        />
      )}

      {showSkeletons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {showResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((item, i) => (
            <MemoryCard key={item.id ?? item.memory_id ?? i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
