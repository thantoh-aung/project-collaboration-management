<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== UPLOADING TEST AVATAR FOR FREELANCERS ===\n\n";

// Get freelancer users
$freelancers = App\Models\User::where('usage_type', 'freelancer')->get();

foreach ($freelancers as $freelancer) {
    echo "Processing freelancer: {$freelancer->name} (ID: {$freelancer->id})\n";
    
    // Create a test avatar URL using UI Avatars service
    $avatarUrl = "https://ui-avatars.com/api/?name=" . urlencode(str_replace(' ', '', $freelancer->name)) . "&size=200&background=4F46E5&color=FFFFFF&bold=true";
    
    // Download and save the avatar
    $avatarContents = file_get_contents($avatarUrl);
    if ($avatarContents) {
        $filename = 'freelancer_' . $freelancer->id . '_' . time() . '.jpg';
        $path = 'profile-photos/' . $filename;
        
        // Save to storage
        $saved = \Storage::disk('public')->put($path, $avatarContents);
        
        if ($saved) {
            // Update user record
            $freelancer->avatar = $path;
            $freelancer->save();
            
            echo "✅ Avatar uploaded: $path\n";
            echo "✅ Avatar URL: " . $freelancer->avatar_url . "\n";
        } else {
            echo "❌ Failed to save avatar\n";
        }
    } else {
        echo "❌ Failed to download avatar from UI Avatars\n";
    }
    echo "---\n";
}

echo "\n=== VERIFICATION ===\n";

// Verify the avatars were set
$updatedFreelancers = App\Models\User::where('usage_type', 'freelancer')->get(['id', 'name', 'avatar', 'avatar_url']);

foreach ($updatedFreelancers as $freelancer) {
    echo "User: {$freelancer->name}\n";
    echo "Avatar: " . ($freelancer->avatar ?? 'NULL') . "\n";
    echo "Avatar URL: " . $freelancer->avatar_url . "\n";
    echo "---\n";
}
