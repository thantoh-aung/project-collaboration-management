<?php

namespace App\Http\Controllers;

use App\Models\FreelancerProfile;
use App\Models\FreelancerReview;
use App\Models\ProjectPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function home(Request $request)
    {
        $user = $request->user();
        // Freelancers want to browse projects; clients want to browse freelancers
        $defaultTab = $user?->usage_type === 'freelancer' ? 'projects' : 'freelancers';
        $tab = $request->get('tab', $defaultTab);

        // --- Freelancers query ---
        $freelancerQuery = FreelancerProfile::published()
            ->with('user:id,name,avatar,email');

        if ($search = $request->get('search')) {
            $freelancerQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('bio', 'like', "%{$search}%")
                  ->orWhereJsonContains('skills', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($skills = $request->get('skills')) {
            $skillsArr = is_array($skills) ? $skills : explode(',', $skills);
            $freelancerQuery->where(function ($q) use ($skillsArr) {
                foreach ($skillsArr as $skill) {
                    $q->orWhereJsonContains('skills', trim($skill));
                }
            });
        }

        if ($availability = $request->get('availability')) {
            $freelancerQuery->where('availability', $availability);
        }

        if ($minRate = $request->get('min_rate')) {
            $freelancerQuery->where('rate_min', '>=', $minRate);
        }
        if ($maxRate = $request->get('max_rate')) {
            $freelancerQuery->where(function ($q) use ($maxRate) {
                $q->where('rate_max', '<=', $maxRate)
                  ->orWhereNull('rate_max');
            });
        }

        if ($minRating = $request->get('min_rating')) {
            $freelancerQuery->where('avg_rating', '>=', $minRating);
        }

        $freelancerQuery->orderByDesc('featured')->orderByDesc('avg_rating');
        $freelancers = $freelancerQuery->paginate(12, ['*'], 'freelancer_page')->withQueryString();

        // --- Projects query ---
        $projectQuery = ProjectPost::open()
            ->with('user:id,name,avatar,email')
            ->orderByDesc('created_at');

        if ($search) {
            $projectQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($skills) {
            $skillsArr = is_array($skills) ? $skills : explode(',', $skills);
            $projectQuery->where(function ($q) use ($skillsArr) {
                foreach ($skillsArr as $skill) {
                    $q->orWhereJsonContains('skills_required', trim($skill));
                }
            });
        }

        $projects = $projectQuery->paginate(12, ['*'], 'project_page')->withQueryString();

        return Inertia::render('Marketplace/Home', [
            'freelancers' => $freelancers,
            'projects' => $projects,
            'filters' => $request->only(['search', 'skills', 'availability', 'min_rate', 'max_rate', 'min_rating', 'tab']),
            'activeTab' => $tab,
        ]);
    }

    public function showFreelancer(string $slug)
    {
        $profile = FreelancerProfile::where('slug', $slug)
            ->where('status', 'published')
            ->with('user:id,name,avatar,email')
            ->firstOrFail();

        $reviews = FreelancerReview::where('freelancer_id', $profile->user_id)
            ->with('client:id,name,avatar')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $hasExistingChat = false;
        $existingChatId = null;
        $user = Auth::user();

        if ($user && $user->usage_type === 'client') {
            $chat = \App\Models\PreProjectChat::where('client_id', $user->id)
                ->where('freelancer_id', $profile->user_id)
                ->first();
            if ($chat) {
                $hasExistingChat = true;
                $existingChatId = $chat->id;
            }
        }

        return Inertia::render('Marketplace/FreelancerProfile', [
            'profile' => $profile,
            'reviews' => $reviews,
            'hasExistingChat' => $hasExistingChat,
            'existingChatId' => $existingChatId,
        ]);
    }

    /**
     * JSON endpoint for freelancer drawer (no page navigation).
     */
    public function freelancerJson(string $slug)
    {
        $profile = FreelancerProfile::where('slug', $slug)
            ->where('status', 'published')
            ->with('user:id,name,avatar,email')
            ->firstOrFail();

        $reviews = FreelancerReview::where('freelancer_id', $profile->user_id)
            ->with('client:id,name,avatar')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $hasExistingChat = false;
        $existingChatId = null;
        $user = Auth::user();

        if ($user) {
            $chat = \App\Models\PreProjectChat::where(function ($q) use ($user, $profile) {
                $q->where('client_id', $user->id)->where('freelancer_id', $profile->user_id);
            })->orWhere(function ($q) use ($user, $profile) {
                $q->where('freelancer_id', $user->id)->where('client_id', $profile->user_id);
            })->first();

            if ($chat) {
                $hasExistingChat = true;
                $existingChatId = $chat->id;
            }
        }

        return response()->json([
            'profile' => $profile,
            'reviews' => $reviews,
            'hasExistingChat' => $hasExistingChat,
            'existingChatId' => $existingChatId,
        ]);
    }

    /**
     * JSON endpoint for project drawer.
     */
    public function projectJson(ProjectPost $project)
    {
        $project->load('user:id,name,avatar,email');
        return response()->json(['project' => $project]);
    }
}
