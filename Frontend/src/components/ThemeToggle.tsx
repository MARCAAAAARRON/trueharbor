import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClass = size === 'sm' ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative inline-flex items-center justify-center rounded-lg border border-fog/80 bg-white/70 hover:bg-white text-slate hover:text-harbor dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/15 dark:text-slate-200 dark:hover:text-white transition-all shadow-2xs hover:shadow-xs active:scale-95 ${sizeClass} ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun
          className={`${iconSize} text-amber-500 transition-all duration-300 absolute ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`${iconSize} text-sky-300 transition-all duration-300 absolute ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}
