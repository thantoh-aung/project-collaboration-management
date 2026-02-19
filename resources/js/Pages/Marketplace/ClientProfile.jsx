import { Head, Link, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/Components/Marketplace/ProjectCard';
import { Building, Globe, MapPin, Briefcase, Edit, Plus } from 'lucide-react';

export default function ClientProfile({ profile, projects }) {
    const { auth } = usePage().props;
    const isOwnProfile = auth?.user?.id === profile.user_id;
    const user = profile.user;

    return (
        <MarketplaceLayout>
            <Head title={`${profile.company_name || user.name} - Client Profile`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {profile.company_name || user.name}
                                </h1>
                                {profile.industry && (
                                    <p className="text-gray-400 mt-1">{profile.industry}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                    {profile.country && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {profile.country}
                                        </span>
                                    )}
                                    {profile.timezone && (
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="h-3.5 w-3.5" />
                                            {profile.timezone}
                                        </span>
                                    )}
                                </div>
                                {profile.website && (
                                    <div className="mt-2">
                                        <a 
                                            href={profile.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            <Globe className="h-3.5 w-3.5" />
                                            {profile.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <Link href={route('marketplace.client-profile.edit')}>
                                <Button variant="outline" className="rounded-xl border-slate-600 text-white hover:bg-slate-700">
                                    <Edit className="h-4 w-4 mr-1.5" /> Edit Profile
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Posted Projects */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white">Posted Projects</h2>
                        {isOwnProfile && (
                            <Link href={route('marketplace.projects.create')}>
                                <Button className="h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/20">
                                    <Plus className="h-4 w-4 mr-1.5" /> Post New Project
                                </Button>
                            </Link>
                        )}
                    </div>

                    {projects && projects.data && projects.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {projects.data.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => window.location.href = route('marketplace.projects.show', project.id)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {projects.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    {projects.links.map((link, i) => {
                                        if (!link.url) return null;
                                        return (
                                            <a
                                                key={i}
                                                href={link.url}
                                                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/30'
                                                        : 'bg-slate-700 border border-slate-600 text-gray-300 hover:bg-blue-600/20 hover:border-blue-500'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-600">
                            <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-white mb-2">
                                {isOwnProfile ? "You haven't posted any projects yet" : "No projects posted yet"}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {isOwnProfile 
                                    ? "Start by posting your first project to find talented freelancers."
                                    : "This client hasn't posted any projects yet."
                                }
                            </p>
                            {isOwnProfile && (
                                <Link href={route('marketplace.projects.create')}>
                                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
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
