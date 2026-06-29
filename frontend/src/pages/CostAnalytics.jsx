import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { getCostTimeseries } from '../api';
import Spinner    from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import PageHeader from '../components/ui/PageHeader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PRESET_RANGES = [
  { label: 'Today',   value: '1d'     },
  { label: '7 days',  value: '7d'     },
  { label: '30 days', value: '30d'    },
  { label: 'Custom',  value: 'custom' },
];

const PIE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtCost(v, decimals = 4) { return `$${Number(v ?? 0).toFixed(decimals)}`; }
function todayISO()    { return new Date().toISOString().slice(0, 10); }
function nDaysAgoISO(n){ const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

// ---------------------------------------------------------------------------
// Chart sub-components
// ---------------------------------------------------------------------------
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{fmtCost(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function ActivePieShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#374151" fontSize={13}>{payload.model}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6366f1" fontSize={15} fontWeight={700}>{fmtCost(value)}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#9ca3af" fontSize={11}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Skeleton placeholders
// ---------------------------------------------------------------------------
function ChartSkeleton({ height = 280 }) {
  return <div className="animate-pulse rounded-2xl bg-gray-100" style={{ height }} />;
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-gray-100 rounded-full mb-3" />
          <div className="h-8 w-28 bg-gray-100 rounded-lg mb-2" />
          <div className="h-3 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------
function SummaryCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm
      transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function CostAnalytics() {
  const [range,      setRange]      = useState('7d');
  const [customFrom, setCustomFrom] = useState(nDaysAgoISO(7));
  const [customTo,   setCustomTo]   = useState(todayISO());
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activePie,  setActivePie]  = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const rangeParam = range === 'custom' ? `${customFrom}:${customTo}` : range;
    const res = await getCostTimeseries(rangeParam);
    setLoading(false);
    if (res.error) { setError(res.error); return; }

    const timeseries = Array.isArray(res.timeseries) ? res.timeseries : Array.isArray(res) ? res : [];
    const byModel    = Array.isArray(res.by_model)   ? res.by_model   : Array.isArray(res.breakdown) ? res.breakdown : [];
    const total      = res.total ?? res.total_cost ?? timeseries.reduce((s, r) => s + Number(r.cost ?? 0), 0);
    const avgPerDay  = timeseries.length ? total / timeseries.length : null;
    const topModel   = [...byModel].sort((a, b) => b.cost - a.cost)[0]?.model ?? null;

    setData({ timeseries, byModel, total, avgPerDay, topModel });
    setActivePie(0);
  }, [range, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRangeClick = (val) => { if (val !== range) { setRange(val); setData(null); } };

  const summaryCards = data ? [
    { icon: '💲', label: 'Total Cost',    value: fmtCost(data.total, 4),  sub: 'Selected period',                                                       accent: 'text-indigo-600'  },
    { icon: '📅', label: 'Avg Cost / Day',value: data.avgPerDay != null ? fmtCost(data.avgPerDay, 4) : '—', sub: `Over ${data.timeseries.length} data point${data.timeseries.length !== 1 ? 's' : ''}`, accent: 'text-emerald-600' },
    { icon: '🧠', label: 'Top Model',     value: data.topModel ?? '—',    sub: 'Highest spend',                                                          accent: 'text-purple-600'  },
  ] : null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* ── Header + range filter ──────────────────────────────── */}
      <PageHeader
        title="Cost Analytics"
        subtitle="Token spend and model cost breakdown."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_RANGES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleRangeClick(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${range === value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* Custom date picker */}
      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {[
            { label: 'From', value: customFrom, max: customTo,   min: undefined,  set: setCustomFrom },
            { label: 'To',   value: customTo,   max: todayISO(), min: customFrom, set: setCustomTo   },
          ].map(({ label, value, max, min, set }) => (
            <div key={label} className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">{label}</label>
              <input type="date" value={value} max={max} min={min}
                onChange={(e) => set(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          ))}
          <button onClick={fetchData} disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            {loading ? <><Spinner size="sm" color="text-white" /> Applying…</> : 'Apply'}
          </button>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState title="Failed to load analytics" message={error} onRetry={fetchData} />}

      {/* Content */}
      {!error && (
        <>
          {/* Summary cards */}
          {loading || !summaryCards
            ? <SummarySkeleton />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {summaryCards.map((c) => <SummaryCard key={c.label} {...c} />)}
              </div>
            )
          }

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Line chart */}
            <div className="xl:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Cost Over Time</h2>
              {loading ? (
                <ChartSkeleton height={280} />
              ) : !data?.timeseries?.length ? (
                <div className="flex items-center justify-center h-64 text-sm text-gray-400">
                  No timeseries data for this range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.timeseries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={fmtDate}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<LineTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280', paddingTop: 12 }} />
                    <Line type="monotone" dataKey="cost" name="Cost (USD)" stroke="#6366f1" strokeWidth={2.5}
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                    {data.timeseries[0]?.input_cost != null && (
                      <Line type="monotone" dataKey="input_cost" name="Input"
                        stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                    )}
                    {data.timeseries[0]?.output_cost != null && (
                      <Line type="monotone" dataKey="output_cost" name="Output"
                        stroke="#06b6d4" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">By Model Tier</h2>
              {loading ? (
                <ChartSkeleton height={280} />
              ) : !data?.byModel?.length ? (
                <div className="flex items-center justify-center h-64 text-sm text-gray-400">
                  No model breakdown available.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.byModel} dataKey="cost" nameKey="model"
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        activeIndex={activePie} activeShape={ActivePieShape}
                        onMouseEnter={(_, i) => setActivePie(i)}>
                        {data.byModel.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-3 space-y-1.5">
                    {data.byModel.map((item, i) => (
                      <li key={item.model} onMouseEnter={() => setActivePie(i)}
                        className="flex items-center justify-between text-xs cursor-pointer
                          hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-gray-600 font-medium">{item.model}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{fmtCost(item.cost)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
