<?php

use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\FreelancerProfileController;
use App\Http\Controllers\ClientProfileController;
use App\Http\Controllers\PreProjectChatController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ProjectPostController;
use App\Http\Controllers\AiChatController;
use Illuminate\Support\Facades\Route;

// Onboarding routes (auth + web for CSRF, no workspace required)
Route::middleware(['web', 'auth'])->prefix('onboarding')->group(function () {
    Route::get('/profile', [OnboardingController::class, 'showProfile'])->name('onboarding.profile');
    Route::post('/profile', [OnboardingController::class, 'saveProfile'])->name('onboarding.profile.save');
    Route::post('/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');
});

// Marketplace routes (auth + web for CSRF + marketplace access, NO workspace middleware)
Route::middleware(['web', 'auth', 'marketplace.access'])->prefix('marketplace')->group(function () {
    // Marketplace home — browse freelancers & projects
    Route::get('/', [MarketplaceController::class, 'home'])->name('marketplace.home');

    // AI Chat Assistant (moved here to avoid workspace middleware)
    Route::post('/api/ai/chat', [AiChatController::class, 'chat'])->name('ai.chat');

    // Freelancer public profile (full page)
    Route::get('/freelancers/{slug}', [MarketplaceController::class, 'showFreelancer'])->name('marketplace.freelancer');

    // JSON API for drawers (no page navigation)
    Route::get('/api/freelancers/{slug}', [MarketplaceController::class, 'freelancerJson'])->name('marketplace.api.freelancer');
    Route::get('/api/projects/{project}', [MarketplaceController::class, 'projectJson'])->name('marketplace.api.project');

    // Project posts (clients)
    Route::get('/projects/create', [ProjectPostController::class, 'create'])->name('marketplace.projects.create');
    Route::post('/projects', [ProjectPostController::class, 'store'])->name('marketplace.projects.store');
    Route::get('/projects/{project}/edit', [ProjectPostController::class, 'edit'])->name('marketplace.projects.edit');
    Route::put('/projects/{project}', [ProjectPostController::class, 'update'])->name('marketplace.projects.update');
    Route::delete('/projects/{project}', [ProjectPostController::class, 'destroy'])->name('marketplace.projects.destroy');

    // Own freelancer profile management
    Route::get('/profile', [FreelancerProfileController::class, 'show'])->name('marketplace.profile');
    Route::post('/profile', [FreelancerProfileController::class, 'update'])->name('marketplace.profile.update');
    Route::post('/profile/publish', [FreelancerProfileController::class, 'publish'])->name('marketplace.profile.publish');
    Route::post('/profile/unpublish', [FreelancerProfileController::class, 'unpublish'])->name('marketplace.profile.unpublish');

    // Universal profile route (redirects based on user type)
    Route::get('/my-profile', function () {
        $user = Auth::user();
        if ($user->usage_type === 'freelancer') {
            return redirect()->route('marketplace.profile');
        } elseif ($user->usage_type === 'client') {
            return redirect()->route('marketplace.client-profile');
        } else {
            // Redirect to onboarding if no usage_type set
            return redirect()->route('onboarding.profile');
        }
    })->name('marketplace.universal-profile');

    // Own client profile management
    Route::get('/client-profile', [ClientProfileController::class, 'show'])->name('marketplace.client-profile');
    Route::get('/client-profile/edit', [ClientProfileController::class, 'edit'])->name('marketplace.client-profile.edit');
    Route::put('/client-profile', [ClientProfileController::class, 'update'])->name('marketplace.client-profile.update');
    Route::post('/client-profile', [ClientProfileController::class, 'update'])->name('marketplace.client-profile.update');

    // Pre-project chats
    Route::get('/chats', [PreProjectChatController::class, 'index'])->name('marketplace.chats.index');
    Route::post('/chats', [PreProjectChatController::class, 'store'])->name('marketplace.chats.store');
    Route::get('/chats/{chat}', [PreProjectChatController::class, 'show'])->name('marketplace.chats.show');
    Route::post('/chats/{chat}/messages', [PreProjectChatController::class, 'sendMessage'])->name('marketplace.chats.message');
    Route::post('/chats/{chat}/upload', [PreProjectChatController::class, 'uploadFile'])->name('marketplace.chats.upload');
    Route::post('/chats/{chat}/upload-multiple', [PreProjectChatController::class, 'uploadMultipleFiles'])->name('marketplace.chats.upload-multiple');
    Route::post('/chats/{chat}/voice', [PreProjectChatController::class, 'uploadVoice'])->name('marketplace.chats.voice');
    Route::post('/chats/{chat}/mark-read', [PreProjectChatController::class, 'markAsRead'])->name('marketplace.chats.mark-read');
    Route::post('/chats/{chat}/archive', [PreProjectChatController::class, 'archive'])->name('marketplace.chats.archive');
    Route::delete('/chats/{chat}', [PreProjectChatController::class, 'delete'])->name('marketplace.chats.delete');
    Route::post('/chats/{chat}/restore', [PreProjectChatController::class, 'restore'])->name('marketplace.chats.restore');

    // Convert chat to workspace (freelancer only)
    Route::post('/chats/{chat}/convert', [PreProjectChatController::class, 'convert'])->name('marketplace.chats.convert');

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store'])->name('marketplace.reviews.store');
});
