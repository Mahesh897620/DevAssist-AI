import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api';
import PageHeader    from '../components/ui/PageHeader';
import RefreshButton from '../components/ui/RefreshButton';
import ErrorState    from '../components/ui/ErrorState';

// ---------------------------------------------------------------------------
// Design tokens (shared palette used site-wide)
// ---------------------------------------------------------------------------
const CARD_CONFIG = [
  {
    key: 'total_sessions',
    label: 'Total Sessions',
    icon: '💬',
    color: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    accent: 'text-indigo-600',
    format: (v) => Number(v).toLocaleString(),
    empty: '—',
  },
  {
    key: 'total_cost_today',
    label: 'Total Cost Today',
    icon: '💲',
    color: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    accent: 'text-emerald-600',
    format: (v) => `$${Number(v).toFixed(4)}`,
    empty: '$0.0000',
  },
  {
    key: 'most_used_model',
    label: 'Most-Used Model',
    icon: '🧠',
    color: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    accent: 'text-purple-600',
    format: (v) => String(v),
    empty: 'N/A',
  },
  {
    key: 'avg_latency',
    label: 'Avg Latency',
    icon: '⚡',
    color: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-600',
    format: (v) => `${Number(v).toLocaleString()} ms`,
    empty: '— ms',
  },
];

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="w-20 h-3 rounded-full bg-gray-100" />
      </div>
      <div className="w-24 h-7 rounded-lg bg-gray-100 mb-2" />
      <div className="w-28 h-3 rounded-full bg-gray-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------
function SummaryCard({ config, value }) {
  const { label, icon, color, iconBg, accent, format, empty } = config;
  const displayValue = value != null ? format(value) : empty;
  const isDim = value == null;

  return (
    <div
      className={`rounded-2xl border border-gray-100 ${color} shadow-sm p-6
        transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${isDim ? 'text-gray-300' : accent}`}>
        {displayValue}
      </p>
      <p className="text-xs text-gray-400 mt-2">Live from backend</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    const result = await getDashboardSummary();
    if (result.error) { setError(result.error); }
    else              { setSummary(result); }
    setLoading(false);
  };

  useEffect(() => { fetchSummary(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your AI assistant activity"
        action={<RefreshButton onClick={fetchSummary} loading={loading} />}
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {!loading && error && (
          <ErrorState
            title="Failed to load summary"
            message={error}
            onRetry={fetchSummary}
            className="col-span-full py-16"
          />
        )}

        {loading && CARD_CONFIG.map((c) => <SkeletonCard key={c.key} />)}

        {!loading && !error && CARD_CONFIG.map((c) => (
          <SummaryCard key={c.key} config={c} value={summary?.[c.key] ?? null} />
        ))}
      </div>

      {/* All-null hint */}
      {!loading && !error && summary &&
        CARD_CONFIG.every((c) => summary[c.key] == null) && (
          <p className="mt-10 text-center text-sm text-gray-400">
            The backend returned an empty summary. Start a session to see data here.
          </p>
        )
      }
    </div>
  );
}
