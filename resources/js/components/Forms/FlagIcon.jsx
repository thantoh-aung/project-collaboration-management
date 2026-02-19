import React from 'react';

// Ultra-simple flag component that works reliably for all countries
export default function FlagIcon({ countryCode, className = "w-6 h-6" }) {
  // Simple flag representations using solid colors and basic symbols
  const getFlagDisplay = (code) => {
    const flags = {
      US: {
        bg: '#B22234',
        text: 'USA',
        textColor: 'white'
      },
      GB: {
        bg: '#012169',
        text: 'UK',
        textColor: 'white'
      },
      CA: {
        bg: '#FF0000',
        text: 'CA',
        textColor: 'white'
      },
      AU: {
        bg: '#012169',
        text: 'AU',
        textColor: 'white'
      },
      DE: {
        bg: '#000000',
        text: 'DE',
        textColor: 'white'
      },
      FR: {
        bg: '#002395',
        text: 'FR',
        textColor: 'white'
      },
      IN: {
        bg: '#FF9933',
        text: 'IN',
        textColor: 'white'
      },
      JP: {
        bg: '#FFFFFF',
        text: 'JP',
        textColor: '#BC002D'
      },
      BR: {
        bg: '#009C3B',
        text: 'BR',
        textColor: 'white'
      },
      MX: {
        bg: '#006847',
        text: 'MX',
        textColor: 'white'
      },
    };

    return flags[code] || {
      bg: '#667eea',
      text: code || '??',
      textColor: 'white'
    };
  };

  const flag = getFlagDisplay(countryCode);

  return (
    <div 
      className={`rounded-sm border border-slate-500 flex items-center justify-center font-bold text-xs ${className}`}
      style={{ 
        backgroundColor: flag.bg,
        color: flag.textColor
      }}
      title={countryCode}
    >
      {flag.text}
    </div>
  );
}
