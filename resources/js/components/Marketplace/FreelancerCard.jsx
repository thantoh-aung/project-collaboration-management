import { MapPin, Github, Linkedin, Globe } from 'lucide-react';
import SkillBadge from './SkillBadge';
import RatingStars from './RatingStars';

const availabilityMap = {
    available: { label: 'Available', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    limited: { label: 'Limited', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    unavailable: { label: 'Unavailable', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

export default function FreelancerCard({ profile, onClick }) {
    const user = profile.user;
    const avail = availabilityMap[profile.availability] || availabilityMap.available;
    const skills = profile.skills || [];
    const avatarSrc = profile.avatar || user?.avatar_url;

    return (
        <div
            onClick={() => onClick && onClick(profile)}
            className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-200 overflow-hidden group cursor-pointer"
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3.5 mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-md shadow-indigo-500/20 overflow-hidden">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt={user?.name} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'F'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{profile.title || 'Freelancer'}</p>
                    </div>
                </div>

                {/* Rating + Availability */}
                <div className="flex items-center justify-between mb-3">
                    <RatingStars rating={profile.avg_rating} count={profile.total_projects} />
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${avail.bg} ${avail.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                        {avail.label}
                    </span>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{profile.bio}</p>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {skills.slice(0, 4).map((skill, i) => (
                            <SkillBadge key={i} skill={skill} />
                        ))}
                        {skills.length > 4 && (
                            <span className="text-xs text-gray-400 self-center">+{skills.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {(profile.github_link || profile.linkedin_link || profile.website_link) && (
                    <div className="flex items-center gap-2 mb-3">
                        {profile.github_link && <Github className="h-3.5 w-3.5 text-gray-400" />}
                        {profile.linkedin_link && <Linkedin className="h-3.5 w-3.5 text-gray-400" />}
                        {profile.website_link && <Globe className="h-3.5 w-3.5 text-gray-400" />}
                    </div>
                )}

                {/* Footer: Rate + Location */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {(profile.rate_min || profile.rate_max) ? (
                        <span className="text-sm font-semibold text-gray-900">
                            ${profile.rate_min}{profile.rate_max ? `–$${profile.rate_max}` : '+'}<span className="text-xs font-normal text-gray-400">/hr</span>
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Rate not set</span>
                    )}
                    {profile.country && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />{profile.country}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
