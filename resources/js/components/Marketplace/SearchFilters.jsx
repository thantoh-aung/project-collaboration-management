import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SearchFilters(props) {
    // Get filters safely
    const filters = props && props.filters ? props.filters : {};
    
    // Initialize state with simple strings
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [availability, setAvailability] = useState('');
    const [minRate, setMinRate] = useState('');
    const [maxRate, setMaxRate] = useState('');
    const [minRating, setMinRating] = useState('');
    const [sortBy, setSortBy] = useState('relevance');

    // Sync with URL filters
    useEffect(() => {
        if (filters && typeof filters === 'object') {
            setSearch(filters.search || '');
            setAvailability(filters.availability || '');
            setMinRate(filters.min_rate || '');
            setMaxRate(filters.max_rate || '');
            setMinRating(filters.min_rating || '');
            setSortBy(filters.sort || 'relevance');
        }
    }, [filters]);

    const applyFilters = () => {
        const params = {};
        if (search) params.search = search;
        if (availability) params.availability = availability;
        if (minRate) params.min_rate = minRate;
        if (maxRate) params.max_rate = maxRate;
        if (minRating) params.min_rating = minRating;
        if (sortBy && sortBy !== 'relevance') params.sort = sortBy;

        router.get(route('marketplace.home'), params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch('');
        setAvailability('');
        setMinRate('');
        setMaxRate('');
        setMinRating('');
        setSort('relevance');
        router.get(route('marketplace.home'), {}, { preserveState: true });
    };

    const hasActiveFilters = availability || minRate || maxRate || minRating || (sortBy && sortBy !== 'relevance');

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        placeholder="Search freelancers by name, skill, or keyword..."
                        className="pl-11 h-12 bg-white border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <Button onClick={applyFilters} className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 text-white font-medium">
                    Search
                </Button>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`h-12 px-4 rounded-xl border-gray-200 ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : ''}`}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />Filters
                    {hasActiveFilters && <span className="ml-1.5 h-2 w-2 rounded-full bg-indigo-500" />}
                </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Availability</label>
                            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20">
                                <option value="">All</option>
                                <option value="available">Available</option>
                                <option value="limited">Limited</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Min Rate ($/hr)</label>
                            <Input type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)} placeholder="0" className="h-9 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Max Rate ($/hr)</label>
                            <Input type="number" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} placeholder="500" className="h-9 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Min Rating</label>
                            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20">
                                <option value="">Any</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Sort by</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-gray-200 bg-white rounded-lg px-3 py-1.5 focus:border-indigo-500">
                                <option value="relevance">Relevance</option>
                                <option value="rating">Highest Rating</option>
                                <option value="rate_low">Lowest Rate</option>
                                <option value="rate_high">Highest Rate</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-red-600">
                                    <X className="h-3.5 w-3.5 mr-1" />Clear
                                </Button>
                            )}
                            <Button size="sm" onClick={applyFilters} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-sm">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
