/**
 * Shared EmptyState — centered placeholder for zero-data views.
 *
 * Props:
 *   icon        string   Emoji icon (default '📭')
 *   title       string   Bold headline
 *   description string   Supporting text
 *   className   string   Extra wrapper classes
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 gap-4 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl select-none">
        {icon}
      </div>
      <div>
        {title && <p className="font-semibold text-gray-700">{title}</p>}
        {description && (
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{description}</p>
        )}
      </div>
    </div>
  );
}
