import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Welcome({ name }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">
                            Welcome to {name}!
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Your Laravel application with Inertia.js, React 19, and shadcn/ui is ready.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button size="lg" className="w-full">
                            Get Started
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
