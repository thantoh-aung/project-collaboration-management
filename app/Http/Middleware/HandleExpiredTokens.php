<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpFoundation\Response;

class HandleExpiredTokens
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (TokenMismatchException $e) {
            // For Inertia requests, return proper Inertia response
            if ($request->header('X-Inertia')) {
                if ($request->is('onboarding/*')) {
                    // For onboarding, don't handle CSRF errors here - let the frontend handle them
                    // This prevents the middleware from interfering with the onboarding flow
                    throw $e;
                }
                
                return redirect()->route('login')
                    ->with('error', 'Your session has expired. Please log in again.');
            }

            // For AJAX requests, return JSON response
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'CSRF token expired. Please refresh the page and try again.',
                    'error' => 'csrf_mismatch'
                ], 419);
            }

            // For onboarding forms, let the frontend handle CSRF errors
            if ($request->is('onboarding/*')) {
                throw $e;
            }

            // For other requests, redirect to login with a message
            return redirect()->route('login')
                ->with('error', 'Your session has expired. Please log in again.');
        }
    }
}
