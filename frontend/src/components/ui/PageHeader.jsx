/**
 * Shared PageHeader — consistent h1 + subtitle + optional right-side action.
 *
 * Props:
 *   title       string
 *   subtitle    string | ReactNode
 *   action      ReactNode  (e.g. a RefreshButton)
 *   className   string
 */
export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-6 flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
