interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';

  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? 40 : '100%'),
    height: height || (variant === 'text' ? 20 : 40),
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Skeleton group for loading states
interface SkeletonGroupProps {
  count?: number;
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonGroup({ count = 3, className = '', children }: SkeletonGroupProps) {
  if (children) {
    return <div className={`space-y-2 ${className}`}>{children}</div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
