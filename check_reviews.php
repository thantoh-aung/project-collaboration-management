<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Checking freelancer_reviews table ===\n\n";

try {
    $reviews = DB::table('freelancer_reviews')->get();
    echo "Total reviews: " . $reviews->count() . "\n\n";
    
    if ($reviews->count() > 0) {
        echo "Sample reviews:\n";
        foreach ($reviews->take(3) as $review) {
            echo "ID: {$review->id}, Freelancer: {$review->freelancer_id}, Client: {$review->client_id}, Rating: {$review->rating}\n";
        }
    } else {
        echo "No reviews found in table.\n";
    }
    
    echo "\n=== Table structure ===\n";
    $columns = DB::getSchemaBuilder()->getColumnListing('freelancer_reviews');
    foreach ($columns as $column) {
        echo "- {$column['name']} ({$column['type']})\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
