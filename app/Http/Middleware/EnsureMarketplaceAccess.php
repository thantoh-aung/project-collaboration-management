<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMarketplaceAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Must complete onboarding to access marketplace
        if (!$user->onboarding_completed) {
            return redirect()->route('onboarding.profile')->with('info', 'Please complete your profile to access the marketplace.');
        }

        // Team members cannot access marketplace
        if ($user->usage_type === 'team_member') {
            abort(403, 'Team members do not have marketplace access. Please contact support to upgrade to Freelancer.');
        }

        return $next($request);
    }
}
