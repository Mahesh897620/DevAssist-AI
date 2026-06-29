import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Spinner from './components/ui/Spinner';

// Eagerly loaded — small, always visible
import Dashboard      from './pages/Dashboard';
import Chat           from './pages/Chat';
import Memory         from './pages/Memory';
import SessionHistory from './pages/SessionHistory';

// Lazy-loaded — pulls in recharts only when the user navigates here
const CostAnalytics = lazy(() => import('./pages/CostAnalytics'));

/** Minimal fallback while the lazy chunk downloads */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-64 text-gray-400 text-sm gap-2">
      <Spinner size="md" />
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto h-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat"      element={<Chat />} />
              <Route path="/memory"    element={<Memory />} />
              <Route path="/history"   element={<SessionHistory />} />
              <Route path="/analytics" element={<CostAnalytics />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
