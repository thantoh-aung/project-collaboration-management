import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, Zap, Shield, Rocket, Star, TrendingUp, Globe, Clock } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Welcome() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        setIsLoaded(true);
        const interval = setInterval(() => setActiveFeature((prev) => (prev + 1) % 4), 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        { icon: Users, title: "Talent Marketplace", description: "Discover and connect with top freelancers. Browse profiles, compare skills, and find perfect match for your project.", color: "bg-[#4F46E5]" },
        { icon: Rocket, title: "Smart Workspaces", description: "Collaborative project workspaces with task management, time tracking, and real-time communication tools.", color: "bg-purple-600" },
        { icon: Clock, title: "Time Tracking", description: "Built-in time tracking with detailed dashboard, and productivity analytics for accurate tasking.", color: "bg-[#14B8A6]" },
        { icon: TrendingUp, title: "Quality Assurance", description: "Built-in review system, milestone tracking, and quality checks to ensure project success.", color: "bg-amber-500" }
    ];

    return (
        <>
            <Head title="Welcome to Our Platform" />
            <div className="min-h-screen bg-white text-[#0F172A] overflow-hidden">
                {/* Subtle Background */}
                <div className="fixed inset-0 overflow-hidden">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-50 transition-all duration-1000 ${isLoaded ? 'scale-100' : 'scale-0'}`}></div>
                    <div className={`absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100 rounded-full filter blur-3xl opacity-50 transition-all duration-1000 delay-300 ${isLoaded ? 'scale-100' : 'scale-0'}`}></div>
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-30 transition-all duration-1000 delay-500 ${isLoaded ? 'scale-100' : 'scale-0'}`}></div>
                </div>

                <div className="relative z-10 container mx-auto px-6 py-20">
                    {/* Hero */}
                    <div className="text-center mb-20">
                        <div className={`transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full mb-8">
                                <Star className="h-4 w-4 text-[#4F46E5] mr-2" />
                                <span className="text-[#4F46E5] text-sm font-medium">Trusted by 10,000+ teams worldwide</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-[#0F172A]">
                                Welcome to the Future of
                                <span className="block text-[#4F46E5]">Work Management</span>
                            </h1>
                            <p className="text-xl text-[#64748B] max-w-4xl mx-auto mb-12 leading-relaxed">
                                The modern freelancer-first SaaS platform that connects talent with opportunities
                                and streamlines project management from discovery to delivery.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link href="/login">
                                    <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md">
                                        Get Started<ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="lg" variant="outline" className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] text-lg px-8 py-4 rounded-xl transition-all duration-300">
                                        Create Account
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mb-20">
                        <div className="text-center mb-16">
                            <h2 className={`text-4xl font-bold mb-4 text-[#0F172A] transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Everything You Need to Succeed</h2>
                            <p className={`text-[#64748B] text-lg transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Powerful features designed for modern teams</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                const isActive = activeFeature === index;
                                return (
                                    <Card key={index} className={`bg-white border-[#E2E8F0] hover:border-[#4F46E5]/30 transition-all duration-500 transform hover:scale-105 hover:shadow-lg ${isActive ? 'ring-2 ring-[#4F46E5] shadow-md' : ''} ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: `${index * 150}ms` }}>
                                        <CardHeader className="text-center pb-4">
                                            <div className={`w-16 h-16 mx-auto mb-4 ${feature.color} rounded-xl flex items-center justify-center transform transition-all duration-500 ${isActive ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}`}><Icon className="h-8 w-8 text-white" /></div>
                                            <CardTitle className="text-[#0F172A] text-xl">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-center"><CardDescription className="text-[#64748B] leading-relaxed">{feature.description}</CardDescription></CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="mb-20">
                        <div className="text-center mb-16">
                            <h2 className={`text-4xl font-bold mb-4 text-[#0F172A] transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>How It Works</h2>
                            <p className={`text-[#64748B] text-lg transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Get started in three simple steps</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: 1, title: "Discover Talent", description: "Browse our marketplace of skilled freelancers. View profiles, portfolios, and reviews to find your perfect match.", color: "bg-[#4F46E5]" },
                                { step: 2, title: "Create Agreement", description: "Discuss project details, agree on terms, and establish milestones. Our platform facilitates clear communication and expectations.", color: "bg-purple-600" },
                                { step: 3, title: "Execute & Deliver", description: "Work in dedicated project workspaces with task management, time tracking, and secure payment release upon completion.", color: "bg-[#14B8A6]" }
                            ].map((item, index) => (
                                <div key={index} className={`text-center transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: `${index * 200}ms` }}>
                                    <div className={`w-20 h-20 mx-auto mb-6 ${item.color} rounded-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-3`}>
                                        <span className="text-3xl font-bold text-white">{item.step}</span>
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-4 text-[#0F172A]">{item.title}</h3>
                                    <p className="text-[#64748B] leading-relaxed">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-20">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            {[{ number: "10,000+", label: "Active Users" }, { number: "5,000+", label: "Projects Completed" }, { number: "99.9%", label: "Uptime" }, { number: "24/7", label: "Support" }].map((stat, index) => (
                                <div key={index} className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                                    <div className="text-4xl font-bold text-[#4F46E5] mb-2">{stat.number}</div>
                                    <div className="text-[#64748B]">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className={`text-center bg-[#4F46E5] rounded-3xl p-16 transition-all duration-1000 transform ${isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-4xl font-bold mb-6 text-white">Ready to Transform Your Workflow?</h2>
                            <p className="text-xl mb-10 text-indigo-100">Join thousands of freelancers and clients already using our platform to streamline their projects and achieve remarkable results.</p>
                            <Link href="/login">
                                <Button size="lg" variant="secondary" className="bg-white text-[#4F46E5] hover:bg-gray-50 text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                                    Get Started Now<ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
