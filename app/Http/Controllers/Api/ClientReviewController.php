<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientReview;
use App\Models\ClientProfile;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientReviewController extends Controller
{
    /**
     * Create or update a review for a client.
     * Only freelancers who share a workspace with the client can review.
     */
    public function store(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $freelancer = Auth::user();

        if ($freelancer->usage_type !== 'freelancer') {
            return response()->json(['error' => 'Only freelancers can review clients'], 403);
        }

        // Verify the freelancer shares a workspace with this client
        $sharedWorkspace = Workspace::where('owner_id', $request->client_id)
            ->whereHas('users', function ($q) use ($freelancer) {
                $q->where('users.id', $freelancer->id);
            })
            ->first();

        if (!$sharedWorkspace) {
            // Also check if freelancer owns a workspace where the client is a member
            $sharedWorkspace = Workspace::where('owner_id', $freelancer->id)
                ->whereHas('users', function ($q) use ($request) {
                    $q->where('users.id', $request->client_id);
                })
                ->first();
        }

        if (!$sharedWorkspace) {
            return response()->json([
                'error' => 'You can only review clients you have collaborated with (shared workspace required).'
            ], 403);
        }

        $review = ClientReview::updateOrCreate(
            [
                'freelancer_id' => $freelancer->id,
                'client_id' => $request->client_id,
            ],
            [
                'workspace_id' => $sharedWorkspace->id,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]
        );

        // Recalculate client's average rating
        $this->recalculateClientRating($request->client_id);

        $review->load('freelancer:id,name,avatar');

        return response()->json($review);
    }

    /**
     * List all reviews for a client.
     */
    public function index($clientId)
    {
        $reviews = ClientReview::where('client_id', $clientId)
            ->with('freelancer:id,name,avatar')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($reviews);
    }

    /**
     * Get the current freelancer's review for a specific client (if it exists).
     */
    public function getFreelancerReview($clientId)
    {
        $freelancer = Auth::user();

        if (!$freelancer || $freelancer->usage_type !== 'freelancer') {
            return response()->json(null);
        }

        $review = ClientReview::where('freelancer_id', $freelancer->id)
            ->where('client_id', $clientId)
            ->with('freelancer:id,name,avatar')
            ->first();

        return response()->json($review);
    }

    private function recalculateClientRating($clientId)
    {
        $avgRating = ClientReview::where('client_id', $clientId)->avg('rating');

        $profile = ClientProfile::where('user_id', $clientId)->first();
        if ($profile) {
            $profile->update([
                'avg_rating' => round($avgRating ?? 0, 2),
            ]);
        }
    }
}
