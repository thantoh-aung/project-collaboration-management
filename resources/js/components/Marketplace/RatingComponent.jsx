import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export default function RatingComponent({ freelancerId, existingRating, onRatingSubmitted }) {
    const [rating, setRating] = useState(existingRating?.rating || 0);
    const [comment, setComment] = useState(existingRating?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const response = await axios.post('/api/freelancer-reviews', {
                freelancer_id: freelancerId,
                rating: rating,
                comment: comment
            });
            
            onRatingSubmitted(response.data);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = 'Failed to submit rating. Please try again.';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 403) {
                errorMessage = 'Only clients can rate freelancers.';
            } else if (error.response?.status === 422) {
                errorMessage = 'Invalid rating data. Please check your input.';
            }
            
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-600 p-4 shadow-lg shadow-blue-600/20">
            <h4 className="font-semibold text-white mb-3">Rate this Freelancer</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Rating
                    </label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="p-1 transition-colors hover:bg-slate-700 rounded"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                            >
                                <Star 
                                    className={`h-6 w-6 transition-colors ${
                                        star <= (hoveredStar || rating) 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-gray-400'
                                    }`}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-400">
                            {rating > 0 ? `${rating}/5` : 'Select rating'}
                        </span>
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comment (optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience working with this freelancer..."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                        rows="3"
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                    {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
                </Button>
            </form>
        </div>
    );
}
