import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import SkillBadge from '@/Components/Marketplace/SkillBadge';
import RatingStars from '@/Components/Marketplace/RatingStars';
import { MapPin, Globe, Clock, MessageSquare, ExternalLink, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const availabilityMap = {
    available: { label: 'Available', dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    limited: { label: 'Limited Availability', dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
    unavailable: { label: 'Unavailable', dot: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50' },
};

export default function FreelancerProfilePage({ profile, reviews, hasExistingChat, existingChatId, hasExistingCollab, existingCollabId }) {
    const { auth } = usePage().props;
    const user = profile.user;
    const avail = availabilityMap[profile.availability] || availabilityMap.available;
    const skills = profile.skills || [];
    const portfolioLinks = profile.portfolio_links || [];
    const isClient = auth?.user?.usage_type === 'client';
    const isFreelancer = auth?.user?.usage_type === 'freelancer';
    const isOwnProfile = auth?.user?.id === profile.user_id;

    const { post: postChat, processing: processingChat } = useForm({ freelancer_id: profile.user_id });
    const { post: postCollab, processing: processingCollab } = useForm({ partner_id: profile.user_id });

    const handleContact = () => {
        if (hasExistingChat) {
            window.location.href = route('marketplace.chats.show', existingChatId);
        } else {
            postChat(route('marketplace.chats.store'));
        }
    };

    const handleCollab = () => {
        if (hasExistingCollab) {
            window.location.href = route('marketplace.collaborations.show', existingCollabId);
        } else {
            postCollab(route('marketplace.collaborations.store'));
        }
    };

    return (
        <MarketplaceLayout>
            <Head title={`${user?.name} - Freelancer Profile`} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back */}
                <Link href={route('marketplace.home')} className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#4F46E5] mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />Back to Marketplace
                </Link>

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
                    <div className="bg-[#4F46E5] h-32" />
                    <div className="px-6 pb-6 -mt-12">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className="h-24 w-24 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg flex-shrink-0">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={user.name} className="h-24 w-24 rounded-2xl object-cover" />
                                ) : (
                                    user?.name?.charAt(0)?.toUpperCase() || 'F'
                                )}
                            </div>
                            <div className="flex-1 pt-2 sm:pt-14">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[#0F172A]">{user?.name}</h1>
                                        <p className="text-[#94A3B8]">{profile.title || 'Freelancer'}</p>
                                    </div>
                                    {isClient && !isOwnProfile && (
                                        <Button
                                            onClick={handleContact}
                                            disabled={processingChat}
                                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-11 px-6"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            {hasExistingChat ? 'Continue Chat' : 'Contact Freelancer'}
                                        </Button>
                                    )}
                                    {isFreelancer && !isOwnProfile && (
                                        <Button
                                            onClick={handleCollab}
                                            disabled={processingCollab}
                                            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl h-11 px-6"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            {hasExistingCollab ? 'Message' : 'Collaborate'}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                    <RatingStars rating={profile.avg_rating} count={reviews?.length || 0} size="md" />
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${avail.bg} ${avail.text}`}>
                                        <span className={`h-2 w-2 rounded-full ${avail.dot}`} />{avail.label}
                                    </span>
                                    {profile.country && (
                                        <span className="flex items-center gap-1 text-sm text-[#94A3B8]"><MapPin className="h-3.5 w-3.5" />{profile.country}</span>
                                    )}
                                    {profile.timezone && (
                                        <span className="flex items-center gap-1 text-sm text-[#94A3B8]"><Clock className="h-3.5 w-3.5" />{profile.timezone}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {profile.bio && (
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                                <h2 className="text-lg font-semibold text-[#0F172A] mb-3">About</h2>
                                <p className="text-[#64748B] text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}

                        {portfolioLinks.length > 0 && (
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                                <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Portfolio</h2>
                                <div className="space-y-2">
                                    {portfolioLinks.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[#F8FAFC] transition-colors group">
                                            <Globe className="h-4 w-4 text-[#94A3B8] group-hover:text-[#4F46E5]" />
                                            <span className="text-sm font-medium text-[#64748B] group-hover:text-[#4F46E5] flex-1">{link.title}</span>
                                            <ExternalLink className="h-3.5 w-3.5 text-[#94A3B8] group-hover:text-[#4F46E5]" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {skills.length > 0 && (
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, i) => (<SkillBadge key={i} skill={skill} />))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Projects</span><span className="font-medium text-[#0F172A]">{profile.total_projects}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Collaborations</span><span className="font-medium text-[#0F172A]">{profile.workspaces_count || 0}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Avg Rating</span><span className="font-medium text-[#0F172A]">{Number(profile.avg_rating).toFixed(1)}/5.0</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Rate</span><span className="font-medium text-[#0F172A]">{profile.rate_min ? `$${profile.rate_min}` : '—'}{profile.rate_max ? `–$${profile.rate_max}/hr` : profile.rate_min ? '+/hr' : ''}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Currency</span><span className="font-medium text-[#0F172A]">{profile.rate_currency || 'USD'}</span></div>
                            </div>
                        </div>

                        {profile.cv_path && (
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Documents</h3>
                                <a href={profile.cv_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[#F8FAFC] transition-colors group">
                                    <FileText className="h-5 w-5 text-[#94A3B8] group-hover:text-[#4F46E5]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#64748B] group-hover:text-[#4F46E5]">Freelancer CV</p>
                                        <p className="text-xs text-[#94A3B8]">PDF / Image</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-[#94A3B8] group-hover:text-[#4F46E5]" />
                                </a>
                            </div>
                        )}

                        {isClient && !isOwnProfile && (
                            <div className="bg-[rgba(79,70,229,0.05)] rounded-xl border border-indigo-200 p-6 text-center">
                                <h3 className="font-semibold text-[#0F172A] mb-2">Interested?</h3>
                                <p className="text-sm text-[#94A3B8] mb-4">Start a conversation to discuss your project.</p>
                                <Button onClick={handleContact} disabled={processingChat} className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {hasExistingChat ? 'Continue Chat' : 'Contact'}
                                </Button>
                            </div>
                        )}

                        {isFreelancer && !isOwnProfile && (
                            <div className="bg-[rgba(20,184,166,0.05)] rounded-xl border border-teal-200 p-6 text-center">
                                <h3 className="font-semibold text-[#0F172A] mb-2">Network?</h3>
                                <p className="text-sm text-[#94A3B8] mb-4">Discuss collaborations or project partnerships.</p>
                                <Button onClick={handleCollab} disabled={processingCollab} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {hasExistingCollab ? 'Continue Message' : 'Message'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
