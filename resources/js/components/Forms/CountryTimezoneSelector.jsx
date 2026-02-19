import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Globe, Clock, ChevronDown, Check } from 'lucide-react';
import { countries, getPopularCountries, searchCountries, getTimezoneByCountry, detectBrowserTimezone } from '@/data/countries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import FlagIcon from './FlagIcon';

export default function CountryTimezoneSelector({ 
  value = { country: '', timezone: '' }, 
  onChange, 
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [autoTimezone, setAutoTimezone] = useState('');
  const dropdownRef = useRef(null);

  // Initialize with existing value
  useEffect(() => {
    if (value.country) {
      const country = countries.find(c => c.code === value.country);
      setSelectedCountry(country);
      if (country && !value.timezone) {
        setAutoTimezone(country.timezone);
      }
    }
  }, [value.country, value.timezone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) {
      // Show popular countries first, then all others
      const popular = getPopularCountries();
      const others = countries.filter(c => !c.popular);
      return [...popular, ...others];
    }
    return searchCountries(searchQuery);
  }, [searchQuery]);

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    const detectedTimezone = getTimezoneByCountry(country.code);
    setAutoTimezone(detectedTimezone);
    
    // Update parent component
    onChange({
      country: country.code,
      timezone: detectedTimezone || ''
    });
    
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle manual timezone change
  const handleTimezoneChange = (timezone) => {
    if (selectedCountry) {
      onChange({
        country: selectedCountry.code,
        timezone: timezone
      });
    }
  };

  // Get display text
  const getDisplayText = () => {
    if (selectedCountry) {
      return selectedCountry.name;
    }
    return 'Select country...';
  };

  return (
    <div className={`space-y-4 ${className}`} ref={dropdownRef}>
      {/* Country Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Globe className="inline h-4 w-4 mr-1" />
          Country
        </label>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between text-left h-12 px-4 border-slate-600 bg-slate-700 text-white hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500/20"
        >
          <span className="flex items-center gap-2">
            {selectedCountry ? (
              <>
                <FlagIcon countryCode={selectedCountry.code} className="w-5 h-4" />
                <span>{selectedCountry.name}</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Select country...</span>
              </>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Country List */}
            <div className="overflow-y-auto max-h-60">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No countries found
                </div>
              ) : (
                <div className="py-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 focus:bg-blue-600/20 focus:outline-none transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <FlagIcon countryCode={country.code} className="w-5 h-4" />
                        <div>
                          <div className="font-medium text-white">{country.name}</div>
                          {country.popular && (
                            <Badge variant="secondary" className="text-xs mt-1 bg-blue-600/20 text-blue-300 border-blue-500/30">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedCountry?.code === country.code && (
                        <Check className="h-4 w-4 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timezone Display */}
      {selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Timezone
          </label>
          
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-white">
                  {autoTimezone || 'Not detected'}
                </span>
              </div>
              
              {autoTimezone && (
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-600/20">
                  Auto-detected
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-gray-400 mt-1">
              Automatically selected based on your country
            </p>
          </div>
        </div>
      )}

      {/* Browser Timezone Detection */}
      {selectedCountry && (
        <div className="text-xs text-gray-400">
          <p>Your browser timezone: {detectBrowserTimezone()}</p>
          {autoTimezone && autoTimezone !== detectBrowserTimezone() && (
            <p className="text-amber-400 mt-1">
              Note: Your browser timezone differs from the selected country's timezone
            </p>
          )}
        </div>
      )}
    </div>
  );
}
