import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FlashNotification = () => {
  const { props } = usePage();
  const [flashes, setFlashes] = useState([]);

  useEffect(() => {
    const newFlashes = [];
    
    // Check for flash messages from props.flash
    if (props.flash) {
      Object.entries(props.flash).forEach(([type, message]) => {
        if (message) {
          newFlashes.push({
            id: `${type}-${Date.now()}`,
            type,
            message,
            timestamp: Date.now()
          });
        }
      });
    }
    
    setFlashes(newFlashes);
  }, [props.flash]);

  const removeFlash = (id) => {
    setFlashes(prev => prev.filter(flash => flash.id !== id));
  };

  const getFlashConfig = (type) => {
    const configs = {
      success: {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-200'
      },
      error: {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-200'
      },
      warning: {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-200'
      },
      info: {
        icon: <Info className="h-5 w-5 text-blue-500" />,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-800 dark:text-blue-200'
      }
    };
    
    return configs[type] || configs.info;
  };

  // Auto-remove flashes after 5 seconds
  useEffect(() => {
    const timers = flashes.map(flash => 
      setTimeout(() => removeFlash(flash.id), 5000)
    );
    
    return () => timers.forEach(clearTimeout);
  }, [flashes]);

  if (flashes.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] space-y-2">
      {flashes.map((flash) => {
        const config = getFlashConfig(flash.type);
        
        return (
          <div
            key={flash.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-top-2",
              config.bgColor,
              config.borderColor
            )}
          >
            {config.icon}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", config.textColor)}>
                {flash.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeFlash(flash.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default FlashNotification;
