import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

// Base form field component
const FormField = ({ 
  label, 
  error, 
  required = false, 
  description, 
  children, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn('text-sm font-medium', required && 'after:content-["*"] after:ml-1 after:text-red-500')}>
          {label}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Text Input
const FormTextInput = forwardRef(({ 
  label, 
  error, 
  required = false, 
  description, 
  placeholder,
  className,
  ...props 
}, ref) => {
  return (
    <FormField label={label} error={error} required={required} description={description}>
      <Input
        ref={ref}
        placeholder={placeholder}
        className={cn(error && 'border-destructive focus:border-destructive', className)}
        {...props}
      />
    </FormField>
  );
});

FormTextInput.displayName = 'FormTextInput';

// Number Input
const FormNumberInput = forwardRef(({ 
  label, 
  error, 
  required = false, 
  description, 
  placeholder,
  min,
  max,
  step,
  className,
  ...props 
}, ref) => {
  return (
    <FormField label={label} error={error} required={required} description={description}>
      <Input
        ref={ref}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={cn(error && 'border-destructive focus:border-destructive', className)}
        {...props}
      />
    </FormField>
  );
});

FormNumberInput.displayName = 'FormNumberInput';

// Textarea
const FormTextarea = forwardRef(({ 
  label, 
  error, 
  required = false, 
  description, 
  placeholder,
  rows = 4,
  className,
  ...props 
}, ref) => {
  return (
    <FormField label={label} error={error} required={required} description={description}>
      <Textarea
        ref={ref}
        placeholder={placeholder}
        rows={rows}
        className={cn(error && 'border-destructive focus:border-destructive', className)}
        {...props}
      />
    </FormField>
  );
});

FormTextarea.displayName = 'FormTextarea';

// Select Input
const FormSelect = ({ 
  label, 
  error, 
  required = false, 
  description, 
  placeholder = "Select an option",
  options = [],
  value,
  onValueChange,
  className,
  ...props 
}) => {
  return (
    <FormField label={label} error={error} required={required} description={description}>
      <Select value={value} onValueChange={onValueChange} {...props}>
        <SelectTrigger className={cn(error && 'border-destructive focus:border-destructive', className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

// MultiSelect (Checkbox group)
const FormMultiSelect = ({ 
  label, 
  error, 
  required = false, 
  description, 
  options = [],
  value = [],
  onValueChange,
  className,
  ...props 
}) => {
  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  return (
    <FormField label={label} error={error} required={required} description={description} className={className}>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <Label 
              htmlFor={`checkbox-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </FormField>
  );
};

// Checkbox (single)
const FormCheckbox = ({ 
  label, 
  error, 
  required = false, 
  description, 
  checked,
  onCheckedChange,
  className,
  ...props 
}) => {
  return (
    <FormField label={label} error={error} required={required} description={description} className={className}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`checkbox-${label}`}
          checked={checked}
          onCheckedChange={onCheckedChange}
          {...props}
        />
        <Label 
          htmlFor={`checkbox-${label}`}
          className="text-sm font-normal cursor-pointer"
        >
          {label}
        </Label>
      </div>
    </FormField>
  );
};

export {
  FormField,
  FormTextInput,
  FormNumberInput,
  FormTextarea,
  FormSelect,
  FormMultiSelect,
  FormCheckbox,
};
