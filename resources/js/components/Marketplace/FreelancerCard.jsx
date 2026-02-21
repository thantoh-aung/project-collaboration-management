import { MapPin, Github, Linkedin, Globe } from 'lucide-react';
import SkillBadge from './SkillBadge';
import RatingStars from './RatingStars';

const availabilityMap = {
    available: { label: 'Available', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    limited: { label: 'Limited', color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    unavailable: { label: 'Unavailable', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
};

export default function FreelancerCard({ profile, onClick }) {
    const user = profile.user;
    const avail = availabilityMap[profile.availability] || availabilityMap.available;
    const skills = profile.skills || [];
    const avatarSrc = profile.avatar_url;

    return (
        <div
            onClick={() => onClick && onClick(profile)}
            className="block bg-white rounded-xl border border-[#E2E8F0] hover:shadow-md hover:border-[rgba(79,70,229,0.3)] transition-all duration-200 overflow-hidden group cursor-pointer"
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3.5 mb-3">
                    <div className="h-12 w-12 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt={user?.name} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'F'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#0F172A] truncate group-hover:text-[#4F46E5] transition-colors">{user?.name}</h3>
                        <p className="text-sm text-[#64748B] truncate">{profile.title || 'Freelancer'}</p>
                    </div>
                </div>

                {/* Rating + Stats */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <RatingStars rating={profile.avg_rating} />
                        <span className="text-xs text-[#94A3B8] font-medium border-l border-[#E2E8F0] pl-2">
                            {profile.total_projects || 0} Projects
                        </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${avail.bg} ${avail.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${avail.color}`} />
                        {avail.label}
                    </span>
                </div>

                <div className="flex items-center gap-2 mb-3 text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                        {profile.workspaces_count || 0} Collaborations
                    </span>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-[#64748B] line-clamp-2 mb-3">{profile.bio}</p>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {skills.slice(0, 4).map((skill, i) => (
                            <SkillBadge key={i} skill={skill} />
                        ))}
                        {skills.length > 4 && (
                            <span className="text-xs text-[#94A3B8] self-center">+{skills.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {(profile.github_link || profile.linkedin_link || profile.website_link) && (
                    <div className="flex items-center gap-2 mb-3">
                        {profile.github_link && <Github className="h-3.5 w-3.5 text-[#94A3B8]" />}
                        {profile.linkedin_link && <Linkedin className="h-3.5 w-3.5 text-[#94A3B8]" />}
                        {profile.website_link && <Globe className="h-3.5 w-3.5 text-[#94A3B8]" />}
                    </div>
                )}

                {/* Footer: Rate + Location */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    {(profile.rate_min || profile.rate_max) ? (
                        <span className="text-sm font-semibold text-[#0F172A]">
                            ${profile.rate_min}{profile.rate_max ? `–$${profile.rate_max}` : '+'}<span className="text-xs font-normal text-[#94A3B8]">/hr</span>
                        </span>
                    ) : (
                        <span className="text-xs text-[#94A3B8]">Rate not set</span>
                    )}
                    {profile.country && (
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                            <MapPin className="h-3 w-3" />{profile.country}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
