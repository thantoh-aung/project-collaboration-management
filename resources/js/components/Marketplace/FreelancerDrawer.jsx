import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { X, MapPin, Star, MessageCircle, Github, Linkedin, Globe, ExternalLink, Loader2, FileText, Calendar, Briefcase, Users } from 'lucide-react';
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
            .then(res => { setData(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [slug]);

    if (!slug) return null;

    const profile = data?.profile;
    const reviews = data?.reviews || [];
    const user = profile?.user;
    const skills = profile?.skills || [];
    const avail = profile ? (availabilityMap[profile.availability] || availabilityMap.limited) : null;
    const canMessage = auth?.user && user?.id && auth.user.id != user.id;
    const authUserType = auth?.user?.usage_type?.toLowerCase();
    const isClient = authUserType === 'client';
    const isFreelancer = authUserType === 'freelancer';

    const handleMessage = () => {
        if (data?.hasExistingChat && data?.existingChatId) {
            router.visit(route('marketplace.chats.show', data.existingChatId));
        } else {
            router.post(route('marketplace.chats.store'), { freelancer_id: profile.user_id || user.id });
        }
    };

    const handleCollab = () => {
        if (data?.hasExistingCollab && data?.existingCollabId) {
            router.visit(route('marketplace.collaborations.show', data.existingCollabId));
        } else {
            router.post(route('marketplace.collaborations.store'), { partner_id: profile.user_id || user.id });
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E2E8F0]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#4F46E5]">
                    <h2 className="text-lg font-semibold text-white">Freelancer Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><X className="h-5 w-5 text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" /></div>
                    ) : !profile ? (
                        <div className="flex items-center justify-center h-64 text-[#94A3B8]">Profile not found</div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden shadow-sm">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={user?.name} className="h-16 w-16 rounded-full object-cover" />
                                    ) : user?.name?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#0F172A]">{user?.name}</h3>
                                    <p className="text-sm text-[#94A3B8]">{profile.title || 'Freelancer'}</p>
                                </div>
                            </div>

                            {/* Availability */}
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${avail.bg} ${avail.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />{avail.label}
                            </span>

                            {/* Bio */}
                            {profile.bio && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#0F172A] mb-2">About</h4>
                                    <p className="text-[#64748B] leading-relaxed whitespace-pre-wrap text-sm">{profile.bio}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {skills.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Skills</h4>
                                    <div className="flex flex-wrap gap-2">{skills.map((skill, i) => <SkillBadge key={i} skill={skill} />)}</div>
                                </div>
                            )}

                            {/* Rate */}
                            {profile.rate_min && (
                                <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3">
                                    <h4 className="text-sm font-semibold text-[#0F172A] mb-1">Rate</h4>
                                    <p className="text-[#64748B] text-sm">${profile.rate_min}{profile.rate_max && ` - $${profile.rate_max}`}/hour</p>
                                </div>
                            )}

                            {/* Location */}
                            {(profile.country || profile.timezone) && (
                                <div className="flex items-center gap-3 text-sm text-[#64748B]">
                                    {profile.country && <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-[#94A3B8]" /><span>{profile.country}</span></div>}
                                    {profile.timezone && <div className="flex items-center gap-1"><span className="text-xs text-[#94A3B8]">UTC</span><span>{profile.timezone}</span></div>}
                                </div>
                            )}

                            {/* Portfolio Links */}
                            {profile.portfolio_links?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Portfolio</h4>
                                    <div className="space-y-2">
                                        {profile.portfolio_links.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#4F46E5] hover:text-[#4338CA]">
                                                <Globe className="h-4 w-4 text-[#94A3B8]" /><span className="truncate">{link.title}</span><ExternalLink className="h-3.5 w-3.5 text-[#94A3B8]" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Social Links</h4>
                                <div className="space-y-2">
                                    {profile.github_link && <a href={profile.github_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#4F46E5] hover:text-[#4338CA]"><Github className="h-4 w-4 text-[#94A3B8]" /><span className="truncate">{profile.github_link}</span><ExternalLink className="h-3.5 w-3.5 text-[#94A3B8]" /></a>}
                                    {profile.linkedin_link && <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#4F46E5] hover:text-[#4338CA]"><Linkedin className="h-4 w-4 text-[#94A3B8]" /><span className="truncate">{profile.linkedin_link}</span><ExternalLink className="h-3.5 w-3.5 text-[#94A3B8]" /></a>}
                                    {profile.website_link && <a href={profile.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#4F46E5] hover:text-[#4338CA]"><Globe className="h-4 w-4 text-[#94A3B8]" /><span className="truncate">{profile.website_link}</span><ExternalLink className="h-3.5 w-3.5 text-[#94A3B8]" /></a>}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            {data?.stats && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0]">
                                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                        <Calendar className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-[#0F172A]">{data.stats.member_since}</p>
                                        <p className="text-xs text-[#94A3B8]">Member Since</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                        <Briefcase className="h-4 w-4 text-[#14B8A6] mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-[#0F172A]">{profile.total_projects || 0}</p>
                                        <p className="text-xs text-[#94A3B8]">Total Projects</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                        <Users className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-[#0F172A]">{data.stats.workspaces_count || 0}</p>
                                        <p className="text-xs text-[#94A3B8]">Collaborations</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                        <Star className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-[#0F172A]">{data.stats.avg_rating > 0 ? data.stats.avg_rating : 'New'}</p>
                                        <div className="text-xs text-[#94A3B8] flex items-center justify-center gap-1">
                                            <span className={`h-1.5 w-1.5 rounded-full ${profile.availability === 'available' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                            {profile.availability === 'available' ? 'Available' : 'Busy'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CV Link */}
                            {profile.cv_path && (
                                <div className="pt-4 border-t border-[#E2E8F0]">
                                    <a href={profile.cv_path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4F46E5] rounded-lg border border-[#E2E8F0] transition-colors w-full justify-center group">
                                        <FileText className="h-4 w-4" /><span className="font-medium text-sm">View CV / Resume</span><ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                                    </a>
                                </div>
                            )}

                            {/* Reviews */}
                            {reviews.length > 0 && (
                                <div className="pt-6 border-t border-[#E2E8F0]">
                                    <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Client Reviews</h3>
                                    <div className="space-y-3">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-[#E2E8F0] flex items-center justify-center overflow-hidden">
                                                            {review.client?.avatar ? <img src={review.client.avatar} alt={review.client.name} className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold text-[#64748B]">{review.client?.name?.charAt(0).toUpperCase() || 'C'}</span>}
                                                        </div>
                                                        <span className="text-xs font-medium text-[#0F172A]">{review.client?.name || 'Client'}</span>
                                                    </div>
                                                    <RatingStars rating={review.rating} />
                                                </div>
                                                {review.comment && <p className="text-xs text-[#64748B] italic">"{review.comment}"</p>}
                                                <p className="text-[9px] text-[#94A3B8] mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action */}
                            {canMessage && (
                                <div className="pt-4">
                                    {isClient ? (
                                        <Button onClick={handleMessage} className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-medium">
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            {data?.hasExistingChat ? 'Continue Chat' : 'Contact Freelancer'}
                                        </Button>
                                    ) : isFreelancer ? (
                                        <Button onClick={handleCollab} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl font-medium">
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            {data?.hasExistingCollab ? 'Message' : 'Collaborate'}
                                        </Button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
