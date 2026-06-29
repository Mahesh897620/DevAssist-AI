import { useState, useEffect, useCallback } from 'react';
import { getSessions, getSessionDetail } from '../api';
import Spinner       from '../components/ui/Spinner';
import ErrorState    from '../components/ui/ErrorState';
import EmptyState    from '../components/ui/EmptyState';
import PageHeader    from '../components/ui/PageHeader';
import RefreshButton from '../components/ui/RefreshButton';

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return isNaN(d) ? ts : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtCost(v) {
  return v != null ? `$${Number(v).toFixed(4)}` : '—';
}
function sortSessions(list, { col, dir }) {
  return [...list].sort((a, b) => {
    const av = col === 'timestamp'
      ? new Date(a.timestamp ?? a.created_at ?? 0).getTime()
      : Number(a.total_cost ?? a.cost ?? 0);
    const bv = col === 'timestamp'
      ? new Date(b.timestamp ?? b.created_at ?? 0).getTime()
      : Number(b.total_cost ?? b.cost ?? 0);
    return dir === 'asc' ? av - bv : bv - av;
  });
}

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------
function SortIcon({ active, dir }) {
  if (!active) return (
    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
  return dir === 'asc' ? (
    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[60, 40, 28, 48, 16].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Message bubble (inside detail panel)
// ---------------------------------------------------------------------------
function MessageBubble({ msg, index }) {
  const role   = msg.role ?? (index % 2 === 0 ? 'user' : 'assistant');
  const text   = msg.content ?? msg.text ?? JSON.stringify(msg);
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5">
          🤖
        </div>
      )}
      <div className={`max-w-lg px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-600 text-white rounded-br-none'
          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
        }`}
      >
        {text}
        {msg.model && (
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/10">
              🧠 {msg.model}
            </span>
            {msg.tokens != null && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/10">
                🔢 {Number(msg.tokens).toLocaleString()} tok
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel (accordion)
// ---------------------------------------------------------------------------
function DetailPanel({ sessionId, onClose }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null); setDetail(null);
    getSessionDetail(sessionId).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else           setDetail(res);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  const messages = detail
    ? (detail.messages ?? detail.history ?? (Array.isArray(detail) ? detail : []))
    : [];

  return (
    <tr>
      <td colSpan={5} className="bg-gray-50 border-b border-indigo-100 px-0">
        <div className="border-t-2 border-indigo-200">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Session Detail</span>
              <span className="font-mono text-xs text-indigo-400">{sessionId}</span>
            </div>
            <button onClick={onClose} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel body */}
          <div className="px-6 py-5 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner size="md" /> Loading session…
              </div>
            )}
            {!loading && error && (
              <div className="flex items-center gap-2 text-sm text-red-500">⚠️ {error}</div>
            )}
            {!loading && !error && messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No messages found for this session.</p>
            )}
            {!loading && !error && messages.length > 0 && (
              <div className="space-y-3">
                {messages.map((msg, i) => <MessageBubble key={msg.id ?? i} msg={msg} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        {[['← Prev', onPrev, page === 1], ['Next →', onNext, page === totalPages]].map(([label, fn, dis]) => (
          <button key={label} onClick={fn} disabled={dis}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SessionHistory() {
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [sort,       setSort]       = useState({ col: 'timestamp', dir: 'desc' });
  const [page,       setPage]       = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError(null); setExpandedId(null);
    const res = await getSessions();
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    const list = Array.isArray(res) ? res : Array.isArray(res.sessions) ? res.sessions : [];
    setSessions(list);
    setPage(1);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const toggleSort = (col) => {
    setSort((prev) => ({ col, dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc' }));
    setPage(1); setExpandedId(null);
  };

  const sorted     = sortSessions(sessions, sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const Th = ({ col, label, className = '' }) => (
    <th
      className={`px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
        ${col ? 'cursor-pointer select-none hover:text-indigo-600 transition-colors' : ''}
        ${className}`}
      onClick={col ? () => toggleSort(col) : undefined}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {col && <SortIcon active={sort.col === col} dir={sort.dir} />}
      </div>
    </th>
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Session History"
        subtitle="All past and active chat sessions — click a row to expand messages."
        action={<RefreshButton onClick={fetchSessions} loading={loading} />}
      />

      {!loading && error && (
        <ErrorState title="Failed to load sessions" message={error} onRetry={fetchSessions} />
      )}

      {!error && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {!loading && sessions.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </span>
              {expandedId && (
                <button onClick={() => setExpandedId(null)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                  Collapse all
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th col="timestamp" label="Timestamp" />
                  <Th label="Messages" className="text-center" />
                  <Th col="cost" label="Total Cost" />
                  <Th label="Model(s) Used" />
                  <th className="px-5 py-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && sessions.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon="📜" title="No sessions yet"
                        description="Start a chat to see history here." />
                    </td>
                  </tr>
                )}

                {!loading && paginated.map((session) => {
                  const id     = session.id ?? session.session_id;
                  const isOpen = expandedId === id;
                  const modelList = (Array.isArray(session.models ?? session.model)
                    ? (session.models ?? [session.model])
                    : [session.models ?? session.model]
                  ).filter(Boolean);

                  return [
                    <tr key={`row-${id}`} onClick={() => setExpandedId((p) => (p === id ? null : id))}
                      className={`cursor-pointer transition-colors
                        ${isOpen ? 'bg-indigo-50 border-l-2 border-l-indigo-400' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {fmt(session.timestamp ?? session.created_at)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full
                          bg-gray-100 text-xs font-semibold text-gray-600">
                          {session.message_count ?? session.messages ?? '?'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {fmtCost(session.total_cost ?? session.cost)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {modelList.map((m) => (
                            <span key={m}
                              className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold">
                              {m}
                            </span>
                          ))}
                          {!modelList.length && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 inline-block
                          ${isOpen ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>,
                    isOpen && (
                      <DetailPanel key={`detail-${id}`} sessionId={id}
                        onClose={() => setExpandedId(null)} />
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <Pagination page={safePage} totalPages={totalPages}
              onPrev={() => { setPage((p) => p - 1); setExpandedId(null); }}
              onNext={() => { setPage((p) => p + 1); setExpandedId(null); }}
            />
          )}
        </div>
      )}
    </div>
  );
}
