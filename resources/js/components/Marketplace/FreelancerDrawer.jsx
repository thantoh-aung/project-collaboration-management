import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MapPin, Star, MessageCircle, Github, Linkedin, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillBadge from './SkillBadge';
import RatingStars from './RatingStars';

const availabilityMap = {
    available: { label: 'Available', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    limited: { label: 'Limited', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    unavailable: { label: 'Unavailable', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

export default function FreelancerDrawer({ slug, onClose }) {
    const { auth } = usePage().props;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        window.axios.get(`/marketplace/api/freelancers/${slug}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    if (!slug) return null;

    const profile = data?.profile;
    const reviews = data?.reviews || [];
    const user = profile?.user;
    const skills = profile?.skills || [];
    const avail = profile ? (availabilityMap[profile.availability] || availabilityMap.available) : null;

    // Check if current user can message this freelancer
    const canMessage = auth?.user?.usage_type === 'client' && auth?.user?.id !== user?.id;

    const handleMessage = () => {
        if (data?.hasExistingChat && data?.existingChatId) {
            router.visit(route('marketplace.chats.show', data.existingChatId));
        } else {
            router.post(route('marketplace.chats.store'), {
                freelancer_id: profile.user_id,
            });
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h2 className="text-lg font-semibold text-gray-900">Freelancer Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/80 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : !profile ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">Profile not found</div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
                                    {profile.avatar || user?.avatar_url ? (
                                        <img src={profile.avatar || user?.avatar_url} alt={user?.name} className="h-16 w-16 rounded-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'F'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                                    <p className="text-sm text-gray-500">{profile.title || 'Freelancer'}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <RatingStars rating={profile.avg_rating} count={profile.total_projects} />
                                        {avail && (
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${avail.bg} ${avail.text}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                                                {avail.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            {(profile.github_link || profile.linkedin_link || profile.website_link) && (
                                <div className="flex items-center gap-3">
                                    {profile.github_link && (
                                        <a href={profile.github_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Github className="h-4 w-4" /> GitHub
                                        </a>
                                    )}
                                    {profile.linkedin_link && (
                                        <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Linkedin className="h-4 w-4" /> LinkedIn
                                        </a>
                                    )}
                                    {profile.website_link && (
                                        <a href={profile.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Globe className="h-4 w-4" /> Portfolio
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Bio */}
                            {profile.bio && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {skills.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, i) => (
                                            <SkillBadge key={i} skill={skill} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rate & Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rate</p>
                                    {(profile.rate_min || profile.rate_max) ? (
                                        <p className="text-lg font-bold text-gray-900">
                                            ${profile.rate_min}{profile.rate_max ? `–$${profile.rate_max}` : '+'}
                                            <span className="text-xs font-normal text-gray-400">/hr</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Not set</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                                    {profile.country ? (
                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" /> {profile.country}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Not specified</p>
                                    )}
                                    {profile.timezone && (
                                        <p className="text-xs text-gray-400 mt-0.5">{profile.timezone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Reviews */}
                            {reviews.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Reviews ({reviews.length})</h4>
                                    <div className="space-y-3">
                                        {reviews.slice(0, 5).map((review) => (
                                            <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-900">{review.client?.name || 'Client'}</span>
                                                    <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {profile && canMessage && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
                        <Button
                            onClick={handleMessage}
                            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 font-medium"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {data?.hasExistingChat ? 'Continue Conversation' : 'Send Message'}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
