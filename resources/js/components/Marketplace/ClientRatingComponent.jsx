import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export default function ClientRatingComponent({ clientId, existingRating, onRatingSubmitted }) {
    const [rating, setRating] = useState(existingRating?.rating || 0);
    const [comment, setComment] = useState(existingRating?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { alert('Please select a rating'); return; }
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/client-reviews', { client_id: clientId, rating, comment });
            onRatingSubmitted(response.data);
        } catch (error) {
            let msg = 'Failed to submit rating. Please try again.';
            if (error.response?.data?.error) msg = error.response.data.error;
            else if (error.response?.data?.message) msg = error.response.data.message;
            else if (error.response?.status === 403) msg = error.response?.data?.error || 'You can only review clients you have collaborated with.';
            else if (error.response?.status === 422) msg = 'Invalid rating data.';
            alert(msg);
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <h4 className="font-semibold text-[#0F172A] mb-3">Rate this Client</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[#64748B] mb-2">Your Rating</label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" className="p-1 transition-colors hover:bg-[#F8FAFC] rounded" onClick={() => setRating(star)} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}>
                                <Star className={`h-6 w-6 transition-colors ${star <= (hoveredStar || rating) ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0]'}`} />
                            </button>
                        ))}
                        <span className="ml-2 text-sm text-[#94A3B8]">{rating > 0 ? `${rating}/5` : 'Select rating'}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#64748B] mb-2">Comment (optional)</label>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience working with this client..." className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-[#0F172A] placeholder-[#94A3B8]" rows="3" />
                </div>
                <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
                </Button>
            </form>
        </div>
    );
}
