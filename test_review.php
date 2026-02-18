<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing FreelancerReview model ===\n\n";

try {
    // Test creating a review
    echo "Attempting to create a test review...\n";
    
    $review = new \App\Models\FreelancerReview();
    $review->freelancer_id = 3; // Test freelancer ID
    $review->client_id = 4; // Test client ID  
    $review->rating = 5;
    $review->comment = 'Test review';
    
    $review->save();
    
    echo "✅ Review created successfully! ID: " . $review->id . "\n";
    
    // Test reading it back
    $savedReview = \App\Models\FreelancerReview::find($review->id);
    echo "✅ Review read back: " . $savedReview->rating . " stars by client " . $savedReview->client_id . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Done ===\n";
