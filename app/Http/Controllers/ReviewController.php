<?php

namespace App\Http\Controllers;

use App\Models\FreelancerReview;
use App\Models\FreelancerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->usage_type !== 'client') {
            abort(403, 'Only clients can leave reviews.');
        }

        $data = $request->validate([
            'freelancer_id' => 'required|exists:users,id',
            'workspace_id' => 'required|exists:workspaces,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        // Ensure client is in the workspace
        $isMember = $user->workspaces()->where('workspace_id', $data['workspace_id'])->exists();
        if (!$isMember) {
            abort(403, 'You are not a member of this workspace.');
        }

        $review = FreelancerReview::updateOrCreate(
            [
                'client_id' => $user->id,
                'workspace_id' => $data['workspace_id'],
            ],
            [
                'freelancer_id' => $data['freelancer_id'],
                'rating' => $data['rating'],
                'comment' => $data['comment'],
            ]
        );

        // Recalculate freelancer rating
        $profile = FreelancerProfile::where('user_id', $data['freelancer_id'])->first();
        if ($profile) {
            $profile->recalculateRating();
        }

        return redirect()->back()->with('success', 'Review submitted successfully.');
    }
}
