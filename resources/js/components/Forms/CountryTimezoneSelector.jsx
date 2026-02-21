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

  useEffect(() => {
    if (value.country) {
      const country = countries.find(c => c.code === value.country);
      setSelectedCountry(country);
      if (country && !value.timezone) setAutoTimezone(country.timezone);
    }
  }, [value.country, value.timezone]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); setSearchQuery(''); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) { const popular = getPopularCountries(); const others = countries.filter(c => !c.popular); return [...popular, ...others]; }
    return searchCountries(searchQuery);
  }, [searchQuery]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    const tz = getTimezoneByCountry(country.code);
    setAutoTimezone(tz);
    onChange({ country: country.code, timezone: tz || '' });
    setIsOpen(false); setSearchQuery('');
  };

  return (
    <div className={`space-y-4 ${className}`} ref={dropdownRef}>
      <div className="relative">
        <label className="block text-sm font-medium text-[#64748B] mb-2">
          <Globe className="inline h-4 w-4 mr-1" /> Country
        </label>
        <Button type="button" variant="outline" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled}
          className="w-full justify-between text-left h-12 px-4 border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#4F46E5]">
          <span className="flex items-center gap-2">
            {selectedCountry ? (<><FlagIcon countryCode={selectedCountry.code} className="w-5 h-4" /><span>{selectedCountry.name}</span></>) : (<><Globe className="h-4 w-4 text-[#94A3B8]" /><span className="text-[#94A3B8]">Select country...</span></>)}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-80 overflow-hidden">
            <div className="p-3 border-b border-[#E2E8F0]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input type="text" placeholder="Search countries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]" autoFocus />
              </div>
            </div>
            <div className="overflow-y-auto max-h-60">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-[#94A3B8]">No countries found</div>
              ) : (
                <div className="py-1">
                  {filteredCountries.map((country) => (
                    <button key={country.code} type="button" onClick={() => handleCountrySelect(country)} className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] focus:bg-indigo-50 focus:outline-none transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FlagIcon countryCode={country.code} className="w-5 h-4" />
                        <div>
                          <div className="font-medium text-[#0F172A]">{country.name}</div>
                          {country.popular && <Badge variant="secondary" className="text-xs mt-1 bg-indigo-50 text-[#4F46E5] border-indigo-200">Popular</Badge>}
                        </div>
                      </div>
                      {selectedCountry?.code === country.code && <Check className="h-4 w-4 text-[#4F46E5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-2"><Clock className="inline h-4 w-4 mr-1" /> Timezone</label>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#94A3B8]" /><span className="text-sm font-medium text-[#0F172A]">{autoTimezone || 'Not detected'}</span></div>
              {autoTimezone && <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600 bg-emerald-50">Auto-detected</Badge>}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Automatically selected based on your country</p>
          </div>
        </div>
      )}

      {selectedCountry && (
        <div className="text-xs text-[#94A3B8]">
          <p>Your browser timezone: {detectBrowserTimezone()}</p>
          {autoTimezone && autoTimezone !== detectBrowserTimezone() && <p className="text-amber-500 mt-1">Note: Your browser timezone differs from the selected country's timezone</p>}
        </div>
      )}
    </div>
  );
}
