<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Checking freelancer_reviews table structure ===\n\n";

try {
    $columns = DB::select("DESCRIBE freelancer_reviews");
    
    foreach ($columns as $column) {
        echo "- {$column->Field} ({$column->Type})";
        if ($column->Null === 'NO' && $column->Default === null) {
            echo " [REQUIRED]";
        }
        echo "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Done ===\n";
