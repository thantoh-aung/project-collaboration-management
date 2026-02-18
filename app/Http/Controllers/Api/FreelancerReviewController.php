<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FreelancerReview;
use App\Models\FreelancerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FreelancerReviewController extends Controller
{
    public function store(Request $request)
    {
        // Debug: Log incoming request
        \Log::info('FreelancerReview store request:', [
            'user_id' => Auth::id(),
            'user_type' => Auth::user()->usage_type,
            'request_data' => $request->all()
        ]);

        $request->validate([
            'freelancer_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $client = Auth::user();
        
        // Ensure the user is a client
        if ($client->usage_type !== 'client') {
            \Log::error('Non-client user attempted to rate:', ['user_id' => $client->id, 'usage_type' => $client->usage_type]);
            return response()->json(['error' => 'Only clients can rate freelancers'], 403);
        }

        // Check if client has already rated this freelancer
        $existingReview = FreelancerReview::where('client_id', $client->id)
            ->where('freelancer_id', $request->freelancer_id)
            ->first();

        if ($existingReview) {
            // Update existing review
            \Log::info('Updating existing review:', ['review_id' => $existingReview->id]);
            $existingReview->update([
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);
            
            $review = $existingReview;
        } else {
            // Create new review
            \Log::info('Creating new review:', [
                'client_id' => $client->id,
                'freelancer_id' => $request->freelancer_id,
                'rating' => $request->rating,
                'comment' => $request->comment
            ]);
            
            try {
                // Get a valid workspace ID
                $workspaceId = $client->current_workspace_id;
                if (!$workspaceId) {
                    // Find the first available workspace as fallback
                    $firstWorkspace = \App\Models\Workspace::first();
                    $workspaceId = $firstWorkspace ? $firstWorkspace->id : null;
                }
                
                if (!$workspaceId) {
                    \Log::error('No valid workspace found for review creation');
                    return response()->json(['error' => 'No valid workspace found'], 500);
                }
                
                $review = FreelancerReview::create([
                    'client_id' => $client->id,
                    'freelancer_id' => $request->freelancer_id,
                    'workspace_id' => $workspaceId,
                    'rating' => $request->rating,
                    'comment' => $request->comment,
                ]);
                \Log::info('Review created successfully:', ['review_id' => $review->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to create review:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                throw $e;
            }
        }

        // Recalculate freelancer's average rating
        $this->recalculateFreelancerRating($request->freelancer_id);

        // Load review with client info
        $review->load('client:id,name,avatar');

        return response()->json($review);
    }

    public function index($freelancerId)
    {
        $reviews = FreelancerReview::where('freelancer_id', $freelancerId)
            ->with('client:id,name,avatar')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($reviews);
    }

    public function getClientReview($freelancerId)
    {
        $client = Auth::user();
        
        if (!$client || $client->usage_type !== 'client') {
            return response()->json(null);
        }

        $review = FreelancerReview::where('client_id', $client->id)
            ->where('freelancer_id', $freelancerId)
            ->with('client:id,name,avatar')
            ->first();

        return response()->json($review);
    }

    private function recalculateFreelancerRating($freelancerId)
    {
        $avgRating = FreelancerReview::where('freelancer_id', $freelancerId)
            ->avg('rating');

        $freelancerProfile = FreelancerProfile::where('user_id', $freelancerId)->first();
        
        if ($freelancerProfile) {
            $freelancerProfile->update([
                'avg_rating' => round($avgRating ?? 0, 2),
            ]);
        }
    }
}
