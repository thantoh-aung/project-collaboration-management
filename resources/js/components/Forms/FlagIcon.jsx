import React from 'react';

// Simple flag component using colored rectangles as fallback
export default function FlagIcon({ countryCode, className = "w-6 h-6" }) {
  const flagStyles = {
    US: { bg: 'linear-gradient(to bottom, #B22234 0%, #B22234 13.33%, white 13.33%, white 26.66%, #B22234 26.66%, #B22234 40%, white 40%, white 53.33%, #B22234 53.33%, #B22234 66.66%, white 66.66%, white 80%, #B22234 80%, #B22234 100%)' },
    GB: { bg: 'linear-gradient(to bottom, #012169 0%, #012169 33.33%, white 33.33%, white 66.66%, #C8102E 66.66%, #C8102E 100%)' },
    CA: { bg: 'linear-gradient(to bottom, #FF0000 0%, #FF0000 25%, white 25%, white 75%, #FF0000 75%, #FF0000 100%)' },
    AU: { bg: 'linear-gradient(to bottom, #012169 0%, #012169 50%, #012169 100%)' },
    DE: { bg: 'linear-gradient(to bottom, black 0%, black 33.33%, #DD0000 33.33%, #DD0000 66.66%, #FFCE00 66.66%, #FFCE00 100%)' },
    FR: { bg: 'linear-gradient(to right, #002395 0%, #002395 33.33%, white 33.33%, white 66.66%, #ED2939 66.66%, #ED2939 100%)' },
    IN: { bg: 'linear-gradient(to bottom, #FF9933 0%, #FF9933 25%, white 25%, white 75%, #138808 75%, #138808 100%)' },
    JP: { bg: 'linear-gradient(to bottom, white 0%, white 100%)' },
    BR: { bg: 'linear-gradient(to bottom, #009C3B 0%, #009C3B 50%, #FFDF00 50%, #FFDF00 100%)' },
    MX: { bg: 'linear-gradient(to bottom, #006847 0%, #006847 25%, white 25%, white 75%, #CE1126 75%, #CE1126 100%)' },
  };

  const style = flagStyles[countryCode] || { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  return (
    <div 
      className={`rounded-sm border border-gray-300 ${className}`}
      style={style}
      title={countryCode}
    >
      {countryCode === 'JP' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      )}
      {countryCode === 'AU' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
