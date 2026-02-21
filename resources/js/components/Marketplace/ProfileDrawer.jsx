import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MapPin, Briefcase, Mail, Calendar, Star, ExternalLink,
    Building, Globe, Users, Award, CheckCircle, X, FileText, MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import RatingComponent from './RatingComponent';
import ClientRatingComponent from './ClientRatingComponent';
import RatingStars from './RatingStars';
import UserProfileLink from '../UserProfileLink';

export default function ProfileDrawer({ isOpen, onClose, userId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [existingRating, setExistingRating] = useState(null);
    const [existingClientRating, setExistingClientRating] = useState(null);
    const [isCollaborating, setIsCollaborating] = useState(false);
    const [isContacting, setIsContacting] = useState(false);
    const { auth } = usePage().props;
    const authUserType = auth?.user?.usage_type?.toLowerCase()?.trim();

    useEffect(() => { if (isOpen && userId) fetchProfile(); }, [isOpen, userId]);

    const handleContact = () => {
        if (profile.hasExistingChat) {
            router.visit(route('marketplace.chats.show', profile.existingChatId));
        } else {
            setIsContacting(true);
            router.post(route('marketplace.chats.store'),
                profile.type === 'freelancer' ? { freelancer_id: userId } : { client_id: userId },
                { onFinish: () => setIsContacting(false) }
            );
        }
    };

    const handleCollab = () => {
        if (profile.hasExistingCollab) {
            router.visit(route('marketplace.collaborations.show', profile.existingCollabId));
        } else {
            setIsCollaborating(true);
            router.post(route('marketplace.collaborations.store'),
                { partner_id: userId },
                { onFinish: () => setIsCollaborating(false) }
            );
        }
    };

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/users/${userId}/profile`);
            setProfile(response.data);
            if (response.data.type === 'freelancer' && response.data.freelancer_profile?.reviews) {
                const myReview = response.data.freelancer_profile.reviews.find(r => r.client_id === auth?.user?.id);
                if (myReview) setExistingRating(myReview);
            }
            if (response.data.type === 'client' && auth?.user?.usage_type === 'freelancer') {
                try {
                    const reviewRes = await axios.get(`/api/client-reviews/${userId}/freelancer-review`);
                    if (reviewRes.data) setExistingClientRating(reviewRes.data);
                } catch (e) { /* no existing review */ }
            }
        } catch (err) {
            setError('Failed to load profile');
        } finally { setLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E2E8F0]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={fetchProfile} variant="outline" className="border-[#E2E8F0] text-[#64748B]">Retry</Button>
                        </div>
                    </div>
                ) : profile ? (
                    <div className="bg-white flex flex-col h-full">
                        {/* Header */}
                        <div className="relative h-32 bg-[#4F46E5] flex-shrink-0">
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                            <div className="absolute -bottom-12 left-6">
                                <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                                    {profile.user.avatar_url ? (
                                        <img src={profile.user.avatar_url} alt={profile.user.name} className="h-24 w-24 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-2xl font-bold">
                                            {profile.user.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="px-6 pb-6 pt-16 flex-1 overflow-y-auto">
                            <div className="flex items-center mb-6">
                                <div className="mb-2 flex-1">
                                    <h2 className="text-2xl font-bold text-[#0F172A]">{profile.user.name}</h2>
                                    <p className="text-[#94A3B8]">{profile.user.email}</p>
                                </div>
                            </div>

                            {/* User Type Badge & Actions */}
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <Badge className={profile.type === 'freelancer' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}>
                                    {profile.type === 'freelancer' ? 'Freelancer' : 'Client'}
                                </Badge>

                                {auth?.user?.id != profile.user.id && (
                                    <div className="flex-1 flex justify-end">
                                        {authUserType === 'client' && profile.type === 'freelancer' && (
                                            <Button
                                                onClick={handleContact}
                                                disabled={isContacting}
                                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 px-4 text-xs"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                {profile.hasExistingChat ? 'Message' : 'Contact'}
                                            </Button>
                                        )}
                                        {authUserType === 'freelancer' && profile.type === 'freelancer' && (
                                            <Button
                                                onClick={handleCollab}
                                                disabled={isCollaborating}
                                                className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl h-10 px-4 text-xs"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                {profile.hasExistingCollab ? 'Message' : 'Collaborate'}
                                            </Button>
                                        )}
                                        {authUserType === 'freelancer' && profile.type === 'client' && (
                                            <Button
                                                onClick={handleContact}
                                                disabled={isContacting}
                                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 px-4 text-xs"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                                {profile.hasExistingChat ? 'Message' : 'Contact'}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Freelancer Profile */}
                            {profile.type === 'freelancer' && profile.freelancer_profile && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Professional Title</h3>
                                        <p className="text-[#64748B]">{profile.freelancer_profile.title || 'No title specified'}</p>
                                    </div>

                                    {profile.freelancer_profile.bio && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">About</h3>
                                            <p className="text-[#64748B] whitespace-pre-wrap">{profile.freelancer_profile.bio}</p>
                                        </div>
                                    )}

                                    {profile.freelancer_profile.skills?.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.freelancer_profile.skills.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="px-3 py-1 bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile.freelancer_profile.rate_min && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Hourly Rate</h3>
                                            <p className="text-[#64748B]">
                                                ${profile.freelancer_profile.rate_min}
                                                {profile.freelancer_profile.rate_max && ` - $${profile.freelancer_profile.rate_max}`}/hour
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {profile.freelancer_profile.country && (
                                            <div className="flex items-center gap-2 text-[#64748B]"><MapPin className="h-4 w-4" /><span>{profile.freelancer_profile.country}</span></div>
                                        )}
                                        {profile.freelancer_profile.timezone && (
                                            <div className="flex items-center gap-2 text-[#64748B]"><Briefcase className="h-4 w-4" /><span>{profile.freelancer_profile.timezone}</span></div>
                                        )}
                                    </div>

                                    {profile.freelancer_profile.portfolio_links?.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Portfolio</h3>
                                            <div className="space-y-2">
                                                {profile.freelancer_profile.portfolio_links.map((link, index) => (
                                                    <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4F46E5] hover:text-[#4338CA]">
                                                        <ExternalLink className="h-4 w-4" /><span className="truncate">{link}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-4">
                                        {profile.freelancer_profile.github_link && (
                                            <a href={profile.freelancer_profile.github_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5]">
                                                <Globe className="h-4 w-4" /><span>GitHub</span>
                                            </a>
                                        )}
                                        {profile.freelancer_profile.linkedin_link && (
                                            <a href={profile.freelancer_profile.linkedin_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5]">
                                                <Users className="h-4 w-4" /><span>LinkedIn</span>
                                            </a>
                                        )}
                                        {profile.freelancer_profile.website_link && (
                                            <a href={profile.freelancer_profile.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5]">
                                                <ExternalLink className="h-4 w-4" /><span>Website</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    {profile.stats && (
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0]">
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Calendar className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.member_since}</p>
                                                <p className="text-xs text-[#94A3B8]">Member Since</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Briefcase className="h-4 w-4 text-[#14B8A6] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.freelancer_profile.total_projects || 0}</p>
                                                <p className="text-xs text-[#94A3B8]">Total Projects</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Users className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.workspaces_count || 0}</p>
                                                <p className="text-xs text-[#94A3B8]">Collaborations</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.avg_rating > 0 ? profile.stats.avg_rating : 'New'}</p>
                                                <div className="text-xs text-[#94A3B8] flex items-center justify-center gap-1">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${profile.freelancer_profile.availability === 'available' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                    {profile.freelancer_profile.availability === 'available' ? 'Available' : 'Busy'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Client Profile */}
                            {profile.type === 'client' && profile.client_profile && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Company</h3>
                                        <p className="text-xl text-[#64748B] font-medium">{profile.client_profile.company_name || 'Not specified'}</p>
                                        {profile.client_profile.industry && <p className="text-[#94A3B8]">{profile.client_profile.industry}</p>}
                                    </div>

                                    {profile.badges && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {profile.badges.email_verified && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    <CheckCircle className="h-3 w-3" /> Email Verified
                                                </span>
                                            )}
                                            {profile.badges.has_website && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                                    <Globe className="h-3 w-3" /> Company Website
                                                </span>
                                            )}
                                            {profile.badges.profile_complete && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] bg-[rgba(79,70,229,0.08)] px-2.5 py-1 rounded-full border border-indigo-200">
                                                    <Award className="h-3 w-3" /> Profile Complete
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {profile.stats && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Calendar className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.member_since}</p>
                                                <p className="text-xs text-[#94A3B8]">Member Since</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Briefcase className="h-4 w-4 text-[#14B8A6] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.projects_posted}</p>
                                                <p className="text-xs text-[#94A3B8]">Projects Posted</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Users className="h-4 w-4 text-[#4F46E5] mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.workspaces_count}</p>
                                                <p className="text-xs text-[#94A3B8]">Collaborations</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center border border-[#E2E8F0]">
                                                <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                                                <p className="text-sm font-semibold text-[#0F172A]">{profile.stats.avg_rating > 0 ? `${profile.stats.avg_rating} ⭐` : 'New'}</p>
                                                <p className="text-xs text-[#94A3B8]">{profile.stats.review_count > 0 ? `${profile.stats.review_count} review${profile.stats.review_count !== 1 ? 's' : ''}` : 'No reviews'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {profile.client_profile.country && (
                                            <div className="flex items-center gap-2 text-[#64748B]"><MapPin className="h-4 w-4" /><span>{profile.client_profile.country}</span></div>
                                        )}
                                        {profile.client_profile.timezone && (
                                            <div className="flex items-center gap-2 text-[#64748B]"><Briefcase className="h-4 w-4" /><span>{profile.client_profile.timezone}</span></div>
                                        )}
                                    </div>

                                    {profile.client_profile.website && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Website</h3>
                                            <a href={profile.client_profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#4F46E5] hover:text-[#4338CA]">
                                                <Globe className="h-4 w-4" /><span>{profile.client_profile.website}</span>
                                            </a>
                                        </div>
                                    )}

                                    {/* Client Reviews */}
                                    {profile.client_reviews?.length > 0 && (
                                        <div className="pt-4 border-t border-[#E2E8F0]">
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Freelancer Reviews</h3>
                                            <div className="space-y-3">
                                                {profile.client_reviews.map((review) => (
                                                    <div key={review.id} className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <UserProfileLink userId={review.freelancer?.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                                                                        {review.freelancer?.avatar ? (
                                                                            <img src={review.freelancer.avatar} alt={review.freelancer.name} className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-[#4F46E5]">{review.freelancer?.name?.charAt(0)?.toUpperCase() || 'F'}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-[#0F172A] hover:text-[#4F46E5] transition-colors">{review.freelancer?.name}</span>
                                                                </div>
                                                            </UserProfileLink>
                                                            <RatingStars rating={review.rating} />
                                                        </div>
                                                        {review.comment && <p className="text-sm text-[#64748B] italic">"{review.comment}"</p>}
                                                        <p className="text-[10px] text-[#94A3B8] mt-1.5">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Posted Projects */}
                                    {profile.posted_projects?.length > 0 && (
                                        <div className="pt-4 border-t border-[#E2E8F0]">
                                            <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Recent Projects</h3>
                                            <div className="space-y-3">
                                                {profile.posted_projects.slice(0, 3).map((project) => (
                                                    <div key={project.id} className="p-3 border border-[#E2E8F0] rounded-lg">
                                                        <h4 className="font-medium text-[#0F172A]">{project.title}</h4>
                                                        <p className="text-sm text-[#94A3B8] mt-1 line-clamp-2">{project.description}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                                                            {project.budget_min && <span>${project.budget_min} - ${project.budget_max}</span>}
                                                            {project.deadline && <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reviews Section (Freelancer) */}
                            {profile.type === 'freelancer' && profile.freelancer_profile?.reviews?.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                                    <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Reviews</h3>
                                    <div className="space-y-4">
                                        {profile.freelancer_profile.reviews.map((review) => (
                                            <div key={review.id} className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <UserProfileLink userId={review.client?.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                                                                {review.client?.avatar ? (
                                                                    <img src={review.client.avatar} alt={review.client.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-[#4F46E5]">{review.client?.name?.charAt(0).toUpperCase() || 'C'}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium text-[#0F172A] hover:text-[#4F46E5] transition-colors">{review.client?.name || 'Client'}</span>
                                                        </div>
                                                    </UserProfileLink>
                                                    <RatingStars rating={review.rating} />
                                                </div>
                                                {review.comment && <p className="text-sm text-[#64748B] italic">"{review.comment}"</p>}
                                                <p className="text-[10px] text-[#94A3B8] mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CV Link */}
                                    {profile.freelancer_profile.cv_path && (
                                        <div className="pt-2">
                                            <a
                                                href={profile.freelancer_profile.cv_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4F46E5] rounded-lg border border-[#E2E8F0] transition-colors w-full justify-center"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span className="font-medium text-sm">View CV / Resume</span>
                                                <ExternalLink className="h-3 w-3 opacity-50" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Rating Section - Client -> Freelancer */}
                            {profile.type === 'freelancer' && auth?.user?.usage_type === 'client' && auth?.user?.id !== profile.user.id && (
                                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                                    <RatingComponent
                                        freelancerId={profile.user.id}
                                        existingRating={existingRating}
                                        onRatingSubmitted={(rating) => { setExistingRating(rating); fetchProfile(); }}
                                    />
                                </div>
                            )}

                            {/* Client Rating Section - Freelancer -> Client */}
                            {profile.type === 'client' && auth?.user?.usage_type === 'freelancer' && auth?.user?.id !== profile.user.id && (
                                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                                    <ClientRatingComponent
                                        clientId={profile.user.id}
                                        existingRating={existingClientRating}
                                        onRatingSubmitted={(rating) => { setExistingClientRating(rating); fetchProfile(); }}
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                                <Button onClick={onClose} variant="outline" className="w-full border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">Close</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-96">
                        <p className="text-[#94A3B8]">No profile data available</p>
                    </div>
                )}
            </div>
        </>
    );
}
