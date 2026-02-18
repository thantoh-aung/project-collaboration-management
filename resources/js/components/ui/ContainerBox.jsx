import { cn } from '@/lib/utils';

const ContainerBox = ({ 
  children, 
  className, 
  shadow = 'md', 
  padding = 30, 
  radius = 'md' 
}) => {
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    none: 'shadow-none',
  };

  const radiusClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
    none: 'rounded-none',
  };

  const paddingClasses = {
    0: 'p-0',
    10: 'p-2.5',
    15: 'p-4',
    20: 'p-5',
    25: 'p-6',
    30: 'p-8',
    40: 'p-10',
    50: 'p-12',
  };

  return (
    <div
      className={cn(
        'bg-white',
        shadowClasses[shadow],
        radiusClasses[radius],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ContainerBox;
