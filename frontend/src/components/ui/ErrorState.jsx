/**
 * Shared ErrorState — centered error card with icon, title, message, and optional retry.
 *
 * Props:
 *   title      string   Headline (default: 'Something went wrong')
 *   message    string   Detail text from the API error
 *   onRetry    fn|null  If provided, renders a Retry button
 *   className  string   Extra wrapper classes (e.g. 'col-span-full', 'py-20')
 */
export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-4 text-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl select-none">
        ⚠️
      </div>
      <div>
        <p className="font-semibold text-gray-700">{title}</p>
        {message && (
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{message}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
