/**
 * Shared RefreshButton — the spinning refresh icon+label used on Dashboard,
 * SessionHistory, and CostAnalytics headers.
 *
 * Props:
 *   onClick    fn
 *   loading    boolean
 *   label      string (default 'Refresh')
 */
export default function RefreshButton({ onClick, loading, label = 'Refresh' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white
        text-sm text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm
        disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0120 15M19.418 15A8 8 0 014 9"
        />
      </svg>
      {loading ? 'Loading…' : label}
    </button>
  );
}
