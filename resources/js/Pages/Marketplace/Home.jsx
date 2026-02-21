import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import FreelancerCard from '@/Components/Marketplace/FreelancerCard';
import ProjectCard from '@/Components/Marketplace/ProjectCard';
import FreelancerDrawer from '@/Components/Marketplace/FreelancerDrawer';
import ProjectDrawer from '@/Components/Marketplace/ProjectDrawer';
import { Users, Briefcase, TrendingUp, Shield, Zap, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home({ freelancers, projects, filters, activeTab }) {
    const { auth } = usePage().props;
    const [tab, setTab] = useState(activeTab || 'freelancers');
    const [search, setSearch] = useState(filters?.search || '');
    const [isSearching, setIsSearching] = useState(false);
    const [drawerFreelancer, setDrawerFreelancer] = useState(null);
    const [drawerProject, setDrawerProject] = useState(null);
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const openProfileDrawer = (userId) => {
        setSelectedUserId(userId);
        setProfileDrawerOpen(true);
    };
    const debounceRef = useRef(null);

    const debouncedSearch = (searchTerm) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (searchTerm !== '') setIsSearching(true);
        debounceRef.current = setTimeout(() => {
            router.get(route('marketplace.home'), {
                tab,
                search: searchTerm || undefined
            }, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsSearching(true),
                onFinish: () => setIsSearching(false),
            });
        }, 300);
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const handleFreelancerClick = (profile) => setDrawerFreelancer(profile.slug);
    const handleProjectClick = (project) => setDrawerProject(project.id);

    const hasFreelancers = freelancers?.data?.length > 0;
    const hasProjects = projects?.data?.length > 0;
    const isClient = auth?.user?.usage_type === 'client';
    const isFreelancer = auth?.user?.usage_type === 'freelancer';

    const switchTab = (newTab) => {
        setTab(newTab);
        router.get(route('marketplace.home'), { tab: newTab, search: search || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = () => {
        router.get(route('marketplace.home'), { tab, search: search || undefined }, { preserveState: true, preserveScroll: true });
    };

    const renderPagination = (paginatedData, paramName) => {
        if (!paginatedData || paginatedData.last_page <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-2 mt-10">
                {paginatedData.links.map((link, i) => {
                    if (!link.url) return null;
                    return (
                        <a
                            key={i}
                            href={link.url}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                ? 'bg-[#4F46E5] text-white'
                                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[rgba(79,70,229,0.3)]'
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <MarketplaceLayout>
            <Head title="Marketplace" />

            {/* Hero */}
            <div className="bg-[#4F46E5] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                            {isClient ? 'Find the perfect freelancer' : isFreelancer ? 'Discover new projects' : 'Marketplace'}
                        </h1>
                        <p className="text-indigo-200 mb-6">
                            Browse talent, discover projects, and start collaborating — all in one place.
                        </p>
                        <div className="flex items-center justify-center gap-6 text-sm text-indigo-200">
                            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4" />Verified</div>
                            <div className="flex items-center gap-1.5"><Zap className="h-4 w-4" />Direct Chat</div>
                            <div className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Workspace</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search + Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#94A3B8]" />
                            <Input
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder={tab === 'freelancers' ? 'Search freelancers by name, skill...' : 'Search projects by title, description...'}
                                className={`pl-11 pr-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] rounded-xl text-sm placeholder-[#94A3B8] ${isSearching ? 'border-[#4F46E5]' : ''}`}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-[#4F46E5] border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button onClick={handleSearch} className="h-11 px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium">
                        Search
                    </Button>
                    {isClient && (
                        <Link href={route('marketplace.projects.create')}>
                            <Button className="h-11 px-5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white font-medium">
                                <Plus className="h-4 w-4 mr-1.5" /> Post Project
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                {(() => {
                    const tabs = isFreelancer
                        ? [
                            { key: 'projects', label: 'Projects', icon: Briefcase, activeColor: 'text-[#14B8A6]' },
                            { key: 'freelancers', label: 'Freelancers', icon: Users, activeColor: 'text-[#4F46E5]' },
                        ]
                        : [
                            { key: 'freelancers', label: 'Freelancers', icon: Users, activeColor: 'text-[#4F46E5]' },
                            { key: 'projects', label: 'Projects', icon: Briefcase, activeColor: 'text-[#14B8A6]' },
                        ];
                    return (
                        <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-8 max-w-xs border border-[#E2E8F0]">
                            {tabs.map(({ key, label, icon: Icon, activeColor }) => (
                                <button
                                    key={key}
                                    onClick={() => switchTab(key)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === key
                                        ? `bg-white ${activeColor} shadow-sm`
                                        : 'text-[#64748B] hover:text-[#0F172A]'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" /> {label}
                                </button>
                            ))}
                        </div>
                    );
                })()}

                {/* Freelancers Tab */}
                {tab === 'freelancers' && (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-semibold text-[#0F172A]">Freelancers</h2>
                                <p className="text-sm text-[#64748B]">{freelancers?.total || 0} freelancer{freelancers?.total !== 1 ? 's' : ''} found</p>
                            </div>
                        </div>

                        {hasFreelancers ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {freelancers.data.map((profile) => (
                                        <FreelancerCard
                                            key={profile.id}
                                            profile={profile}
                                            onClick={handleFreelancerClick}
                                        />
                                    ))}
                                </div>
                                {renderPagination(freelancers, 'freelancer_page')}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <Users className="h-16 w-16 text-[#94A3B8] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[#0F172A] mb-2">No freelancers found</h3>
                                <p className="text-sm text-[#64748B] max-w-md mx-auto">
                                    {search ? 'Try adjusting your search to find more results.' : 'No freelancers have published their profiles yet.'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Projects Tab */}
                {tab === 'projects' && (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-semibold text-[#0F172A]">Open Projects</h2>
                                <p className="text-sm text-[#64748B]">{projects?.total || 0} project{projects?.total !== 1 ? 's' : ''} available</p>
                            </div>
                        </div>

                        {hasProjects ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {projects.data.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            onClick={handleProjectClick}
                                        />
                                    ))}
                                </div>
                                {renderPagination(projects, 'project_page')}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <Briefcase className="h-16 w-16 text-[#94A3B8] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[#0F172A] mb-2">No projects yet</h3>
                                <p className="text-sm text-[#64748B] max-w-md mx-auto">
                                    {search ? 'Try adjusting your search.' : 'No projects have been posted yet. Check back soon!'}
                                </p>
                                {isClient && (
                                    <Link href={route('marketplace.projects.create')} className="mt-4 inline-block">
                                        <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl">
                                            <Plus className="h-4 w-4 mr-1.5" /> Post the First Project
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Profile Drawers */}
            {drawerFreelancer && (
                <FreelancerDrawer
                    slug={drawerFreelancer}
                    onClose={() => {
                        setDrawerFreelancer(null);
                        setSelectedUserId(null);
                    }}
                />
            )}
            {drawerProject && (
                <ProjectDrawer
                    projectId={drawerProject}
                    onClose={() => {
                        setDrawerProject(null);
                        setSelectedUserId(null);
                    }}
                />
            )}
        </MarketplaceLayout>
    );
}
