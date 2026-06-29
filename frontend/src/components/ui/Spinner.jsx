/**
 * Shared Spinner — use everywhere a loading indicator is needed.
 *
 * Props:
 *   size      'sm' | 'md' | 'lg' | 'xl'   default 'md'
 *   color     any Tailwind text-* class     default 'text-indigo-500'
 *   className  extra classes
 */
export default function Spinner({ size = 'md', color = 'text-indigo-500', className = '' }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };
  return (
    <svg
      className={`animate-spin ${sizes[size] ?? sizes.md} ${color} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
