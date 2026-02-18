<?php

namespace App\Http\Controllers;

use App\Models\ProjectPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectPostController extends Controller
{
    public function create()
    {
        return Inertia::render('Marketplace/PostProject');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'budget_min' => 'nullable|numeric|min:0|max:999999999999.99', // Max 12 digits before decimal
            'budget_max' => 'nullable|numeric|min:0|max:999999999999.99', // Max 12 digits before decimal
            'budget_type' => 'required|in:fixed,hourly,milestone',
            'budget_currency' => 'nullable|string|max:3',
            'deadline' => 'nullable|string', // Accept both date and text values
            'skills_required' => 'nullable|array',
            'skills_required.*' => 'string|max:50',
            'country' => 'nullable|string|max:100',
            'timezone' => 'nullable|string|max:100',
        ]);

        // Custom validation: budget_max must be greater than budget_min if both are provided
        if ($data['budget_min'] && $data['budget_max'] && $data['budget_max'] <= $data['budget_min']) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['budget_max' => 'Maximum budget must be greater than minimum budget.']);
        }

        // Convert deadline text to date if needed
        if (!empty($data['deadline']) && $data['deadline'] !== 'flexible') {
            $data['deadline'] = $this->convertDeadlineToDate($data['deadline']);
        } elseif ($data['deadline'] === 'flexible') {
            $data['deadline'] = null;
        }

        $data['user_id'] = Auth::id();
        $data['status'] = 'open';

        try {
            ProjectPost::create($data);

            return redirect()->route('marketplace.home')
                ->with('success', 'Project posted successfully!');
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database errors, especially out of range errors
            if (strpos($e->getMessage(), 'Out of range') !== false) {
                return redirect()->back()
                    ->withInput()
                    ->withErrors(['budget' => 'Budget values are too large. Please enter smaller amounts.']);
            }
            
            // Log the error and show a generic message
            \Log::error('ProjectPost creation failed: ' . $e->getMessage());
            
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create project post. Please check your input and try again.']);
        }
    }

    /**
     * Convert deadline text to date
     */
    private function convertDeadlineToDate($deadline)
    {
        $today = now();
        
        switch ($deadline) {
            case '1_week':
                return $today->addDays(7)->toDateString();
            case '2_weeks':
                return $today->addDays(14)->toDateString();
            case '1_month':
                return $today->addMonth()->toDateString();
            case '3_months':
                return $today->addMonths(3)->toDateString();
            case '6_months':
                return $today->addMonths(6)->toDateString();
            default:
                // If it's already a date format, return as is
                if (strtotime($deadline)) {
                    return $deadline;
                }
                return null;
        }
    }

    public function edit(ProjectPost $project)
    {
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Marketplace/EditProject', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, ProjectPost $project)
    {
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
            'budget_type' => 'required|in:fixed,hourly,milestone',
            'budget_currency' => 'nullable|string|max:3',
            'deadline' => 'nullable|date|after:today',
            'skills_required' => 'nullable|array',
            'skills_required.*' => 'string|max:50',
            'status' => 'nullable|in:open,in_progress,closed',
        ]);

        $project->update($data);

        return redirect()->back()->with('success', 'Project updated successfully.');
    }

    public function destroy(ProjectPost $project, Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return back()->withErrors(['permission' => 'You must be logged in to delete a project.']);
        }

        // Check if user owns the project
        if ($project->user_id !== Auth::id()) {
            return back()->withErrors(['permission' => 'You don\'t have permission to delete this project.']);
        }

        try {
            $project->delete();

            // Check the referring URL to determine where to redirect
            $referer = $request->header('referer');
            $redirectRoute = 'marketplace.home'; // default
            
            if ($referer) {
                // Check if coming from client profile page
                if (str_contains($referer, '/client-profile') || str_contains($referer, '/profile')) {
                    $user = Auth::user();
                    if ($user->usage_type === 'client') {
                        $redirectRoute = 'marketplace.client-profile';
                    } else {
                        $redirectRoute = 'marketplace.profile';
                    }
                }
            }

            return redirect()->route($redirectRoute)
                ->with('success', 'Project deleted successfully.');
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error deleting project: ' . $e->getMessage());
            
            return back()->withErrors(['delete_error' => 'Error deleting project. Please try again.']);
        }
    }

    public function show(ProjectPost $project)
    {
        $project->load('user:id,name,avatar,email');
        return response()->json($project);
    }
}
