<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check freelancer avatars
echo "=== FREELANCER AVATAR INVESTIGATION ===\n\n";

$freelancers = App\Models\User::where('usage_type', 'freelancer')->limit(5)->get(['id', 'name', 'avatar', 'usage_type']);

echo "Freelancer Users:\n";
foreach ($freelancers as $freelancer) {
    echo "ID: {$freelancer->id}\n";
    echo "Name: {$freelancer->name}\n";
    echo "Avatar: " . ($freelancer->avatar ?? 'NULL') . "\n";
    echo "Avatar URL: " . $freelancer->avatar_url . "\n";
    echo "Usage Type: {$freelancer->usage_type}\n";
    echo "---\n";
}

// Check client avatars for comparison
echo "\n=== CLIENT AVATAR COMPARISON ===\n\n";

$clients = App\Models\User::where('usage_type', 'client')->limit(3)->get(['id', 'name', 'avatar', 'usage_type']);

echo "Client Users:\n";
foreach ($clients as $client) {
    echo "ID: {$client->id}\n";
    echo "Name: {$client->name}\n";
    echo "Avatar: " . ($client->avatar ?? 'NULL') . "\n";
    echo "Avatar URL: " . $client->avatar_url . "\n";
    echo "Usage Type: {$client->usage_type}\n";
    echo "---\n";
}

echo "\n=== STORAGE CHECK ===\n";
$profilePhotosPath = storage_path('app/public/profile-photos');
echo "Profile photos directory: $profilePhotosPath\n";
echo "Directory exists: " . (is_dir($profilePhotosPath) ? 'YES' : 'NO') . "\n";
echo "Directory readable: " . (is_readable($profilePhotosPath) ? 'YES' : 'NO') . "\n";

if (is_dir($profilePhotosPath)) {
    $files = scandir($profilePhotosPath);
    echo "Files in directory: " . count($files) . "\n";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "- $file\n";
        }
    }
}
