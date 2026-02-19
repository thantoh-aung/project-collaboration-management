<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Show the welcome page for unauthenticated users.
     * Redirect authenticated users to dashboard.
     * Skip welcome page for invitation links.
     */
    public function index(Request $request)
    {
        // If user is already authenticated, redirect to dashboard
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        // Check if this is an invitation link - if so, bypass welcome page
        if ($request->has('token') || $request->has('invitation')) {
            return redirect()->route('login', ['token' => $request->get('token')]);
        }

        // Check for invitation in session (in case it was set before redirect)
        if ($request->session()->has('invitation_token')) {
            return redirect()->route('login', ['token' => $request->session()->get('invitation_token')]);
        }

        // Show welcome page for normal unauthenticated users
        return Inertia::render('Welcome');
    }
}
