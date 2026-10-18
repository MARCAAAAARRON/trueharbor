import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'on-blue' | 'ghost' | 'destructive';
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Height 44px (touch target), radius-md (4px), font-body font-semibold text-sm
  const base = "h-[44px] px-5 rounded-md font-body font-semibold text-sm transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none";

  const variants = {
    primary: "bg-harbor text-white hover:bg-harbor-hover active:bg-harbor-hover focus-visible:outline-2 focus-visible:outline-harbor",
    secondary: "bg-white text-harbor border border-harbor hover:bg-wash active:bg-wash",
    outline: "bg-white text-harbor border border-harbor hover:bg-wash active:bg-wash",
    'on-blue': "bg-white dark:bg-white text-[#002459] dark:text-[#002459] hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-100 shadow-sm",
    ghost: "bg-transparent text-harbor hover:bg-wash active:bg-wash",
    destructive: "bg-buoy text-white hover:bg-red-700 active:bg-red-800",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
