<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\WelcomeController;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

Route::get('/test', function () {
    return view('test');
});

// API Routes
Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::get('/users/{user}/profile', [App\Http\Controllers\Api\UserProfileController::class, 'show']);
    
    // Freelancer Reviews
    Route::post('/freelancer-reviews', [App\Http\Controllers\Api\FreelancerReviewController::class, 'store']);
    Route::get('/freelancer-reviews/{freelancerId}', [App\Http\Controllers\Api\FreelancerReviewController::class, 'index']);
    Route::get('/freelancer-reviews/{freelancerId}/client-review', [App\Http\Controllers\Api\FreelancerReviewController::class, 'getClientReview']);
});

require __DIR__.'/auth.php';
require __DIR__.'/marketplace.php';
