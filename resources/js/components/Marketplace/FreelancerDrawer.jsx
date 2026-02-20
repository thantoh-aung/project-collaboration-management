import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MapPin, Star, MessageCircle, Github, Linkedin, Globe, ExternalLink, Loader2, FileText } from 'lucide-react';
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
    const avail = profile ? (availabilityMap[profile.availability] || availabilityMap.limited) : null;

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
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
                    <h2 className="text-lg font-semibold text-white">Freelancer Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        </div>
                    ) : !profile ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Profile not found
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-blue-500/20 overflow-hidden">
                                    {profile.avatar || user?.avatar_url ? (
                                        <img src={profile.avatar || user?.avatar_url} alt={user?.name} className="h-16 w-16 rounded-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'F'
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                                    <p className="text-sm text-gray-400">{profile.title || 'Freelancer'}</p>
                                </div>
                            </div>

                            {/* Availability Badge */}
                            <div className="mt-3">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${avail.bg} ${avail.text} border border-slate-600/30`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                                    {avail.label}
                                </span>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-white mb-2">About</h4>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {skills.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-white mb-3">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, i) => (
                                            <SkillBadge key={i} skill={skill} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rate */}
                            {profile.rate_min && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-white mb-2">Rate</h4>
                                    <p className="text-gray-300">
                                        ${profile.rate_min}
                                        {profile.rate_max && ` - ${profile.rate_max}`}
                                        /hour
                                    </p>
                                </div>
                            )}

                            {/* Location & Timezone */}
                            {(profile.country || profile.timezone) && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        {profile.country && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                <span>{profile.country}</span>
                                            </div>
                                        )}
                                        {profile.timezone && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-400">UTC</span>
                                                <span>{profile.timezone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Portfolio Links */}
                            {profile.portfolio_links && profile.portfolio_links.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-white mb-3">Portfolio</h4>
                                    <div className="space-y-2">
                                        {profile.portfolio_links.map((link, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-1">
                                                    <span className="truncate">{link.title}</span>
                                                    <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-white mb-3">Social Links</h4>
                                <div className="space-y-4">
                                    {profile.github_link && (
                                        <div className="flex items-center gap-2">
                                            <Github className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <a href={profile.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-1">
                                                <span className="truncate">{profile.github_link}</span>
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                            </a>
                                        </div>
                                    )}
                                    {profile.linkedin_link && (
                                        <div className="flex items-center gap-2">
                                            <Linkedin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-1">
                                                <span className="truncate">{profile.linkedin_link}</span>
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                            </a>
                                        </div>
                                    )}
                                    {profile.website_link && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <a href={profile.website_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-1">
                                                <span className="truncate">{profile.website_link}</span>
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {profile.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-400">Rating</div>
                                </div>
                            </div>

                            {/* CV Link */}
                            {profile.cv_path && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <a
                                        href={profile.cv_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg border border-slate-600 transition-colors w-full justify-center group"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="font-medium text-sm">View CV / Resume</span>
                                        <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                            )}

                            {/* Reviews Section */}
                            {reviews.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-700">
                                    <h3 className="text-sm font-semibold text-white mb-4">Client Reviews</h3>
                                    <div className="space-y-4">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                                                            {review.client?.avatar ? (
                                                                <img src={review.client.avatar} alt={review.client.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-white">
                                                                    {review.client?.name?.charAt(0).toUpperCase() || 'C'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-white">{review.client?.name || 'Client'}</span>
                                                    </div>
                                                    <RatingStars rating={review.rating} />
                                                </div>
                                                {review.comment && (
                                                    <p className="text-xs text-gray-300 italic">"{review.comment}"</p>
                                                )}
                                                <p className="text-[9px] text-gray-500 mt-2">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            {canMessage && (
                                <div className="mt-6 pt-4">
                                    <Button
                                        onClick={handleMessage}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        {data?.hasExistingChat ? 'Continue Chat' : 'Contact Freelancer'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
