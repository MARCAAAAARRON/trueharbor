interface LogoProps {
  variant?: 'blue' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ variant = 'blue', size = 'md', className = '' }: LogoProps) {
  const iconSrc = variant === 'blue' ? '/logo-mark-blue.png' : '/logo-mark-white.png';

  const sizeClasses = {
    sm: { img: 'h-6', text: 'text-lg' },
    md: { img: 'h-8', text: 'text-xl' },
    lg: { img: 'h-10', text: 'text-2xl' },
  }[size];

  const textColor = variant === 'blue' ? 'text-harbor' : 'text-white';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={iconSrc}
        alt="TrueHarbor logo"
        className={`${sizeClasses.img} w-auto object-contain flex-shrink-0`}
      />
      <span className={`font-display font-bold tracking-tight ${sizeClasses.text} ${textColor}`}>
        TrueHarbor
      </span>
    </div>
  );
}
