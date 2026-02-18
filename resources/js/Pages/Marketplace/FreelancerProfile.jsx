import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import SkillBadge from '@/Components/Marketplace/SkillBadge';
import RatingStars from '@/Components/Marketplace/RatingStars';
import { MapPin, Globe, Clock, MessageSquare, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const availabilityMap = {
    available: { label: 'Available', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    limited: { label: 'Limited Availability', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    unavailable: { label: 'Unavailable', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

export default function FreelancerProfilePage({ profile, reviews, hasExistingChat, existingChatId }) {
    const { auth } = usePage().props;
    const user = profile.user;
    const avail = availabilityMap[profile.availability] || availabilityMap.available;
    const skills = profile.skills || [];
    const portfolioLinks = profile.portfolio_links || [];
    const isClient = auth?.user?.usage_type === 'client';
    const isOwnProfile = auth?.user?.id === profile.user_id;

    const { post, processing } = useForm({ freelancer_id: profile.user_id });

    const handleContact = () => {
        if (hasExistingChat) {
            window.location.href = route('marketplace.chats.show', existingChatId);
        } else {
            post(route('marketplace.chats.store'));
        }
    };

    return (
        <MarketplaceLayout>
            <Head title={`${user?.name} - Freelancer Profile`} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back */}
                <Link href={route('marketplace.home')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />Back to Marketplace
                </Link>

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32" />
                    <div className="px-6 pb-6 -mt-12">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg flex-shrink-0">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="h-24 w-24 rounded-2xl object-cover" />
                                ) : (
                                    user?.name?.charAt(0)?.toUpperCase() || 'F'
                                )}
                            </div>
                            <div className="flex-1 pt-2 sm:pt-14">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                        <p className="text-gray-600">{profile.title || 'Freelancer'}</p>
                                    </div>
                                    {isClient && !isOwnProfile && (
                                        <Button
                                            onClick={handleContact}
                                            disabled={processing}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl h-11 px-6"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            {hasExistingChat ? 'Continue Chat' : 'Contact Freelancer'}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                    <RatingStars rating={profile.avg_rating} count={reviews?.length || 0} size="md" />
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${avail.bg} ${avail.text}`}>
                                        <span className={`h-2 w-2 rounded-full ${avail.dot}`} />{avail.label}
                                    </span>
                                    {profile.country && (
                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="h-3.5 w-3.5" />{profile.country}
                                        </span>
                                    )}
                                    {profile.timezone && (
                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <Clock className="h-3.5 w-3.5" />{profile.timezone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About */}
                        {profile.bio && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}

                        {/* Portfolio */}
                        {portfolioLinks.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Portfolio</h2>
                                <div className="space-y-2">
                                    {portfolioLinks.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group">
                                            <Globe className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 flex-1">{link.title}</span>
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {skills.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, i) => (
                                        <SkillBadge key={i} skill={skill} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Projects</span>
                                    <span className="font-medium text-gray-900">{profile.total_projects}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Avg Rating</span>
                                    <span className="font-medium text-gray-900">{Number(profile.avg_rating).toFixed(1)}/5.0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Rate</span>
                                    <span className="font-medium text-gray-900">
                                        {profile.rate_min ? `$${profile.rate_min}` : '—'}{profile.rate_max ? `–$${profile.rate_max}/hr` : profile.rate_min ? '+/hr' : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Currency</span>
                                    <span className="font-medium text-gray-900">{profile.rate_currency || 'USD'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact CTA */}
                        {isClient && !isOwnProfile && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 text-center">
                                <h3 className="font-semibold text-gray-900 mb-2">Interested?</h3>
                                <p className="text-sm text-gray-600 mb-4">Start a conversation to discuss your project.</p>
                                <Button
                                    onClick={handleContact}
                                    disabled={processing}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {hasExistingChat ? 'Continue Chat' : 'Contact'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
