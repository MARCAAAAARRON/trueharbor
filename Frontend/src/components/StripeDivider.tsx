interface StripeDividerProps {
  className?: string;
  variant?: 'blue' | 'white';
}

export default function StripeDivider({ className = '', variant = 'blue' }: StripeDividerProps) {
  const barColor = variant === 'blue' ? 'bg-harbor' : 'bg-white';

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`} aria-hidden="true">
      <div className={`h-1 ${barColor} w-full opacity-90`} />
      <div className={`h-1 ${barColor} w-full opacity-90`} />
    </div>
  );
}
