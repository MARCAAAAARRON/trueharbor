import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

interface LogoProps {
  variant?: 'auto' | 'blue' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ variant = 'auto', size = 'md', className = '' }: LogoProps) {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext ? themeContext.isDark : false;

  const effectiveVariant = variant === 'auto' ? (isDark ? 'white' : 'blue') : variant;
  const iconSrc = effectiveVariant === 'blue' ? '/logo-mark-blue.png' : '/logo-mark-white.png';

  const sizeClasses = {
    sm: { img: 'h-6', text: 'text-lg' },
    md: { img: 'h-8', text: 'text-xl' },
    lg: { img: 'h-10', text: 'text-2xl' },
  }[size];

  const textColor =
    effectiveVariant === 'blue'
      ? 'text-harbor dark:text-white'
      : 'text-white';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={iconSrc}
        alt="TrueHarbor logo"
        className={`${sizeClasses.img} w-auto object-contain flex-shrink-0 transition-opacity duration-200`}
      />
      <span className={`font-display font-bold tracking-tight ${sizeClasses.text} ${textColor}`}>
        TrueHarbor
      </span>
    </div>
  );
}
