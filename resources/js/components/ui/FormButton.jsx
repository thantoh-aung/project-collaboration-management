import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Send } from 'lucide-react';

// Submit Button
const FormSubmitButton = forwardRef(({ 
  children = 'Submit',
  loading = false,
  disabled = false,
  leftSection,
  className,
  ...props 
}, ref) => {
  const defaultIcon = leftSection || <Save className="h-4 w-4" />;
  
  return (
    <Button
      ref={ref}
      type="submit"
      disabled={disabled || loading}
      className={cn('rounded-xl', className)}
      {...props}
    >
      {defaultIcon && <span className="mr-2">{defaultIcon}</span>}
      {loading ? 'Submitting...' : children}
    </Button>
  );
});

FormSubmitButton.displayName = 'FormSubmitButton';

// Back Button
const FormBackButton = forwardRef(({ 
  children = 'Back',
  href,
  onClick,
  className,
  ...props 
}, ref) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    } else {
      window.history.back();
    }
  };

  return (
    <Button
      ref={ref}
      variant="secondary"
      onClick={handleClick}
      className={cn('mb-4', className)}
      {...props}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children}
    </Button>
  );
});

FormBackButton.displayName = 'FormBackButton';

// Cancel Button
const FormCancelButton = forwardRef(({ 
  children = 'Cancel',
  onClick,
  className,
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      onClick={onClick}
      className={cn('rounded-xl', className)}
      {...props}
    >
      {children}
    </Button>
  );
});

FormCancelButton.displayName = 'FormCancelButton';

export {
  FormSubmitButton,
  FormBackButton,
  FormCancelButton,
};
