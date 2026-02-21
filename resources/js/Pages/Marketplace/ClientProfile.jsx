import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/Components/Marketplace/ProjectCard';
import {
    Building, Globe, MapPin, Briefcase, Edit, Plus, Star,
    Calendar, FolderKanban, Users, CheckCircle2, Shield,
    MessageCircle, Send, X
} from 'lucide-react';

export default function ClientProfile({ profile, projects, reviews, stats, badges, canReview, existingReview }) {
    const { auth } = usePage().props;
    const isOwnProfile = auth?.user?.id === profile.user_id;
    const user = profile.user;
    const isFreelancer = auth?.user?.usage_type === 'freelancer';

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(existingReview?.rating || 0);
    const [reviewComment, setReviewComment] = useState(existingReview?.comment || '');
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const submitReview = async () => {
        if (reviewRating === 0) { setReviewError('Please select a rating'); return; }
        setSubmittingReview(true);
        setReviewError('');
        try {
            await window.axios.post('/api/client-reviews', {
                client_id: profile.user_id, rating: reviewRating, comment: reviewComment || null,
            });
            setShowReviewForm(false);
            router.reload({ only: ['reviews', 'stats', 'existingReview'] });
        } catch (err) {
            setReviewError(err.response?.data?.error || 'Failed to submit review');
        } finally { setSubmittingReview(false); }
    };

    const renderStars = (rating, size = 'h-4 w-4') => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`${size} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0]'}`} />
        ));
    };

    return (
        <MarketplaceLayout>
            <Head title={`${profile.company_name || user?.name} - Client Profile`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Card */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-[#E2E8F0]" />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xl">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A]">{profile.company_name || user?.name}</h1>
                                {profile.industry && <p className="text-[#94A3B8] mt-1">{profile.industry}</p>}
                                <div className="flex items-center gap-4 mt-2 text-sm text-[#94A3B8]">
                                    {profile.country && (<span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.country}</span>)}
                                    {profile.timezone && (<span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{profile.timezone}</span>)}
                                </div>
                                {profile.website && (
                                    <div className="mt-2">
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#4F46E5] hover:text-[#4338CA]">
                                            <Globe className="h-3.5 w-3.5" />{profile.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}

                                {badges && (
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        {badges.email_verified && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                <CheckCircle2 className="h-3 w-3" /> Email Verified
                                            </span>
                                        )}
                                        {badges.has_website && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                                <Globe className="h-3 w-3" /> Company Website
                                            </span>
                                        )}
                                        {badges.profile_complete && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] bg-[rgba(79,70,229,0.08)] px-2.5 py-1 rounded-full border border-indigo-200">
                                                <Shield className="h-3 w-3" /> Profile Complete
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <Link href={route('marketplace.client-profile.edit')}>
                                <Button variant="outline" className="rounded-xl border-[#E2E8F0] text-[#64748B]">
                                    <Edit className="h-4 w-4 mr-1.5" /> Edit Profile
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
                            <Calendar className="h-5 w-5 text-[#4F46E5] mx-auto mb-1.5" />
                            <p className="text-sm font-semibold text-[#0F172A]">{stats.member_since}</p>
                            <p className="text-xs text-[#94A3B8]">Member Since</p>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
                            <FolderKanban className="h-5 w-5 text-[#14B8A6] mx-auto mb-1.5" />
                            <p className="text-sm font-semibold text-[#0F172A]">{stats.projects_posted}</p>
                            <p className="text-xs text-[#94A3B8]">Projects Posted</p>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
                            <Users className="h-5 w-5 text-[#4F46E5] mx-auto mb-1.5" />
                            <p className="text-sm font-semibold text-[#0F172A]">{stats.workspaces_count}</p>
                            <p className="text-xs text-[#94A3B8]">Collaborations</p>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
                            <Star className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
                            <p className="text-sm font-semibold text-[#0F172A]">{stats.avg_rating > 0 ? `${stats.avg_rating} ⭐` : 'New'}</p>
                            <p className="text-xs text-[#94A3B8]">{stats.review_count > 0 ? `${stats.review_count} review${stats.review_count !== 1 ? 's' : ''}` : 'No reviews yet'}</p>
                        </div>
                    </div>
                )}

                {/* Reviews Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-[#4F46E5]" /> Freelancer Reviews
                        </h2>
                        {canReview && !isOwnProfile && (
                            <Button onClick={() => setShowReviewForm(true)} className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium">
                                <Star className="h-3.5 w-3.5 mr-1.5" />
                                {existingReview ? 'Update Review' : 'Write a Review'}
                            </Button>
                        )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-5 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[#0F172A] font-medium">{existingReview ? 'Update Your Review' : 'Rate This Client'}</h3>
                                <button onClick={() => setShowReviewForm(false)} className="text-[#94A3B8] hover:text-[#64748B]"><X className="h-5 w-5" /></button>
                            </div>

                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-sm text-[#94A3B8] mr-2">Rating:</span>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <button key={i} onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(i + 1)} className="transition-transform hover:scale-110">
                                        <Star className={`h-7 w-7 ${(hoverRating || reviewRating) > i ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0]'}`} />
                                    </button>
                                ))}
                                {reviewRating > 0 && <span className="ml-2 text-sm text-amber-500 font-medium">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}</span>}
                            </div>

                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your experience working with this client... (optional)"
                                className="w-full h-24 bg-white border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] resize-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                                maxLength={1000}
                            />

                            {reviewError && <p className="text-red-500 text-sm mt-2">{reviewError}</p>}

                            <div className="flex items-center justify-end gap-2 mt-3">
                                <Button onClick={() => setShowReviewForm(false)} variant="outline" className="rounded-lg border-[#E2E8F0] text-[#64748B] text-sm">Cancel</Button>
                                <Button onClick={submitReview} disabled={submittingReview || reviewRating === 0} className="rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm">
                                    {submittingReview ? (
                                        <span className="flex items-center gap-1.5">
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>Submitting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5" />{existingReview ? 'Update Review' : 'Submit Review'}</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Reviews List */}
                    {reviews && reviews.length > 0 ? (
                        <div className="space-y-3">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                                    <div className="flex items-start gap-3">
                                        {review.freelancer?.avatar ? (
                                            <img src={review.freelancer.avatar} alt={review.freelancer.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-[#E2E8F0]" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-[#14B8A6] flex items-center justify-center text-white text-sm font-bold">
                                                {review.freelancer?.name?.charAt(0)?.toUpperCase() || 'F'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-[#0F172A]">{review.freelancer?.name}</p>
                                                <span className="text-xs text-[#94A3B8]">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">{renderStars(review.rating, 'h-3.5 w-3.5')}</div>
                                            {review.comment && <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{review.comment}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-[#E2E8F0]">
                            <MessageCircle className="h-10 w-10 text-[#E2E8F0] mx-auto mb-2" />
                            <p className="text-sm text-[#94A3B8]">No reviews yet</p>
                            {isOwnProfile && <p className="text-xs text-[#94A3B8] mt-1">Reviews from freelancers you've collaborated with will appear here.</p>}
                        </div>
                    )}
                </div>

                {/* Posted Projects */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-[#0F172A]">Posted Projects</h2>
                        {isOwnProfile && (
                            <Link href={route('marketplace.projects.create')}>
                                <Button className="h-10 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-white font-medium">
                                    <Plus className="h-4 w-4 mr-1.5" /> Post New Project
                                </Button>
                            </Link>
                        )}
                    </div>

                    {projects && projects.data && projects.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {projects.data.map((project) => (
                                    <ProjectCard key={project.id} project={project} onClick={() => window.location.href = route('marketplace.projects.show', project.id)} />
                                ))}
                            </div>

                            {projects.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    {projects.links.map((link, i) => {
                                        if (!link.url) return null;
                                        return (
                                            <a key={i} href={link.url}
                                                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                                    ? 'bg-[#4F46E5] text-white'
                                                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#4F46E5]'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
                            <Briefcase className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-[#0F172A] mb-2">
                                {isOwnProfile ? "You haven't posted any projects yet" : "No projects posted yet"}
                            </h3>
                            <p className="text-sm text-[#94A3B8] mb-4">
                                {isOwnProfile ? "Start by posting your first project to find talented freelancers." : "This client hasn't posted any projects yet."}
                            </p>
                            {isOwnProfile && (
                                <Link href={route('marketplace.projects.create')}>
                                    <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl">
                                        <Plus className="h-4 w-4 mr-1.5" /> Post Your First Project
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}
