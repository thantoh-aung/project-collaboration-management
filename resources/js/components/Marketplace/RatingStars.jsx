import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, count = null, size = 'sm' }) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<Star key={i} className={`${iconSize} text-yellow-400 fill-yellow-400`} />);
        } else if (i === fullStars && hasHalf) {
            stars.push(<Star key={i} className={`${iconSize} text-yellow-400 fill-yellow-400 opacity-60`} />);
        } else {
            stars.push(<Star key={i} className={`${iconSize} text-gray-300`} />);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex">{stars}</div>
            {rating > 0 && <span className="text-xs font-medium text-gray-600 ml-0.5">{Number(rating).toFixed(1)}</span>}
            {count !== null && <span className="text-xs text-gray-400">({count})</span>}
        </div>
    );
}
