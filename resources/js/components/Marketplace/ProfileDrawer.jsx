import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    MapPin, 
    Briefcase, 
    Mail, 
    Calendar, 
    Star, 
    ExternalLink,
    Building,
    Globe,
    Users,
    Award,
    CheckCircle,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import RatingComponent from './RatingComponent';

export default function ProfileDrawer({ isOpen, onClose, userId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [existingRating, setExistingRating] = useState(null);
    const { auth } = usePage().props;

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`/api/users/${userId}/profile`);
            console.log('🔍 ProfileDrawer Debug - API Response:', response.data);
            setProfile(response.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={fetchProfile} variant="outline">Retry</Button>
                        </div>
                    </div>
                ) : profile ? (
                    <div className="bg-white flex flex-col h-full">
                        {/* Header */}
                        <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            {/* Avatar positioned on header */}
                            <div className="absolute -bottom-12 left-6">
                                <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                                    {profile.user.avatar_url ? (
                                        <img 
                                            src={profile.user.avatar_url} 
                                            alt={profile.user.name} 
                                            className="h-24 w-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
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
                                    <h2 className="text-2xl font-bold text-gray-900">{profile.user.name}</h2>
                                    <p className="text-gray-600">{profile.user.email}</p>
                                </div>
                            </div>

                            {/* User Type Badge */}
                            <div className="mb-6">
                                <Badge className={
                                    profile.type === 'freelancer' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-blue-100 text-blue-700'
                                }>
                                    {profile.type === 'freelancer' ? 'Freelancer' : 'Client'}
                                </Badge>
                            </div>

                            {/* Profile Details */}
                            {profile.type === 'freelancer' && profile.freelancer_profile && (
                                <div className="space-y-6">
                                    {/* Title and Bio */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Title</h3>
                                        <p className="text-gray-700">{profile.freelancer_profile.title || 'No title specified'}</p>
                                    </div>

                                    {profile.freelancer_profile.bio && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">{profile.freelancer_profile.bio}</p>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {profile.freelancer_profile.skills && profile.freelancer_profile.skills.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.freelancer_profile.skills.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rate */}
                                    {profile.freelancer_profile.rate_min && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hourly Rate</h3>
                                            <p className="text-gray-700">
                                                ${profile.freelancer_profile.rate_min}
                                                {profile.freelancer_profile.rate_max && ` - $${profile.freelancer_profile.rate_max}`}
                                                /hour
                                            </p>
                                        </div>
                                    )}

                                    {/* Location & Timezone */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {profile.freelancer_profile.country && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="h-4 w-4" />
                                                <span>{profile.freelancer_profile.country}</span>
                                            </div>
                                        )}
                                        {profile.freelancer_profile.timezone && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Briefcase className="h-4 w-4" />
                                                <span>{profile.freelancer_profile.timezone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Portfolio Links */}
                                    {profile.freelancer_profile.portfolio_links && profile.freelancer_profile.portfolio_links.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio</h3>
                                            <div className="space-y-2">
                                                {profile.freelancer_profile.portfolio_links.map((link, index) => (
                                                    <a
                                                        key={index}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        <span className="truncate">{link}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Social Links */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {profile.freelancer_profile.github_link && (
                                            <a
                                                href={profile.freelancer_profile.github_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                                            >
                                                <Globe className="h-4 w-4" />
                                                <span>GitHub</span>
                                            </a>
                                        )}
                                        {profile.freelancer_profile.linkedin_link && (
                                            <a
                                                href={profile.freelancer_profile.linkedin_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                                            >
                                                <Users className="h-4 w-4" />
                                                <span>LinkedIn</span>
                                            </a>
                                        )}
                                        {profile.freelancer_profile.website_link && (
                                            <a
                                                href={profile.freelancer_profile.website_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                <span>Website</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {profile.freelancer_profile.total_projects || 0}
                                            </div>
                                            <div className="text-sm text-gray-500">Projects</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {profile.freelancer_profile.avg_rating ? parseFloat(profile.freelancer_profile.avg_rating).toFixed(1) : 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">Rating</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {profile.freelancer_profile.availability === 'available' ? 'Available' : 'Busy'}
                                            </div>
                                            <div className="text-sm text-gray-500">Status</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profile.type === 'client' && profile.client_profile && (
                                <div className="space-y-6">
                                    {/* Company Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Company</h3>
                                        <p className="text-xl text-gray-700 font-medium">
                                            {profile.client_profile.company_name || 'Not specified'}
                                        </p>
                                        {profile.client_profile.industry && (
                                            <p className="text-gray-600">{profile.client_profile.industry}</p>
                                        )}
                                    </div>

                                    {/* Location & Timezone */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {profile.client_profile.country && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="h-4 w-4" />
                                                <span>{profile.client_profile.country}</span>
                                            </div>
                                        )}
                                        {profile.client_profile.timezone && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Briefcase className="h-4 w-4" />
                                                <span>{profile.client_profile.timezone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Website */}
                                    {profile.client_profile.website && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Website</h3>
                                            <a
                                                href={profile.client_profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Globe className="h-4 w-4" />
                                                <span>{profile.client_profile.website}</span>
                                            </a>
                                        </div>
                                    )}

                                    {/* Posted Projects */}
                                    {profile.posted_projects && profile.posted_projects.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Projects</h3>
                                            <div className="space-y-3">
                                                {profile.posted_projects.slice(0, 3).map((project) => (
                                                    <div key={project.id} className="p-3 border border-gray-200 rounded-lg">
                                                        <h4 className="font-medium text-gray-900">{project.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                            {project.budget_min && (
                                                                <span>${project.budget_min} - ${project.budget_max}</span>
                                                            )}
                                                            {project.deadline && (
                                                                <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Rating Section - Only for clients viewing freelancers */}
                            {profile.type === 'freelancer' && auth?.user?.usage_type === 'client' && (
                                <div className="mt-8 pt-6 border-t">
                                    <RatingComponent
                                        freelancerId={profile.user.id}
                                        existingRating={existingRating}
                                        onRatingSubmitted={(rating) => {
                                            setExistingRating(rating);
                                            // Optionally refresh profile data to show updated rating
                                            fetchProfile();
                                        }}
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-8 pt-6 border-t">
                                <Button onClick={onClose} variant="outline" className="w-full">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-96">
                        <p className="text-gray-500">No profile data available</p>
                    </div>
                )}
            </div>
        </>
    );
}
