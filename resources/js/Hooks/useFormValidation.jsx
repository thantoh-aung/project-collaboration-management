import { useForm } from 'laravel-precognition-react-inertia';
import { useState } from 'react';

export const useFormValidation = (method, url, initialValues = {}) => {
  const form = useForm(method, url, initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await form.submit({
        onSuccess: () => {
          setIsSubmitting(false);
          // Success handling can be customized
        },
        onError: (errors) => {
          setIsSubmitting(false);
          // Error handling - errors are automatically displayed
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error('Form submission error:', error);
    }
  };

  const resetForm = () => {
    form.reset();
    form.clearErrors();
  };

  const setFieldValue = (field, value) => {
    form.setData(field, value);
    // Clear error for this field when value changes
    if (form.errors[field]) {
      form.clearErrors(field);
    }
  };

  const getFieldError = (field) => {
    return form.errors[field] || null;
  };

  const isFieldInvalid = (field) => {
    return !!form.errors[field];
  };

  return {
    // Form state
    data: form.data,
    errors: form.errors,
    processing: form.processing || isSubmitting,
    recentlySuccessful: form.recentlySuccessful,
    wasSuccessful: form.wasSuccessful,

    // Form methods
    setData: form.setData,
    setFieldValue,
    submit: handleSubmit,
    reset: resetForm,
    clearErrors: form.clearErrors,
    
    // Validation helpers
    getFieldError,
    isFieldInvalid,
    
    // Original form methods for advanced usage
    form,
  };
};

export default useFormValidation;
