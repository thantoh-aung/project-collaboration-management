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

        // Team members cannot access marketplace
        if ($user->usage_type === 'team_member') {
            abort(403, 'Team members do not have marketplace access.');
        }

        return $next($request);
    }
}
