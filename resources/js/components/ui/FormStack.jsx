import { cn } from '@/lib/utils';

const FormStack = ({ children, gap = 'md', className }) => {
  const gapClasses = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  };

  return (
    <div className={cn(gapClasses[gap], className)}>
      {children}
    </div>
  );
};

export default FormStack;
