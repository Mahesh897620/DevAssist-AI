import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard',      to: '/dashboard' },
  { icon: '💬', label: 'Chat',           to: '/chat'      },
  { icon: '🧠', label: 'Memory',         to: '/memory'    },
  { icon: '📜', label: 'Session History',to: '/history'   },
  { icon: '📊', label: 'Cost Analytics', to: '/analytics' },
];

const STORAGE_KEY = 'sidebar_collapsed';

export default function Sidebar() {
  const { pathname } = useLocation();

  // Initialise: collapsed on small screens, expanded on md+
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  // Persist preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed);
  }, [collapsed]);

  // Auto-collapse when viewport shrinks below md
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => { if (e.matches) setCollapsed(true); };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggle = () => setCollapsed((c) => !c);

  return (
    <aside
      style={{ width: collapsed ? '4rem' : '16rem' }}
      className="relative flex flex-col h-full bg-gray-900 text-gray-100 shadow-xl
        transition-[width] duration-300 ease-in-out overflow-hidden shrink-0"
    >
      {/* ── Logo / App name ────────────────────────────────────── */}
      <div
        className={`flex items-center gap-3 border-b border-gray-700
          ${collapsed ? 'justify-center px-0 py-5' : 'px-5 py-5'}`}
      >
        <span className="text-2xl shrink-0 select-none">🤖</span>
        {!collapsed && (
          <span className="text-base font-semibold tracking-wide whitespace-nowrap overflow-hidden">
            AI Assistant
          </span>
        )}
      </div>

      {/* ── Nav links ──────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ icon, label, to }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium
                transition-colors duration-150 overflow-hidden
                ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'}
                ${active
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <span className="text-xl shrink-0 select-none">{icon}</span>
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer + toggle button ──────────────────────────────── */}
      <div className={`border-t border-gray-700 ${collapsed ? 'py-3 flex justify-center' : 'px-4 py-3'}`}>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-gray-400
            hover:bg-gray-700 hover:text-white transition-colors duration-150
            text-xs font-medium justify-center"
        >
          {/* Arrow icon rotates based on collapsed state */}
          <svg
            className={`w-4 h-4 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-gray-600 mt-1 text-center select-none">v1.0.0</p>
        )}
      </div>
    </aside>
  );
}
