<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Find a project with team members
$project = \App\Models\Project::with('teamMembers')->find(32);

if ($project) {
    echo "Project: {$project->name}\n";
    echo "Team Members Count: " . $project->teamMembers->count() . "\n";
    
    foreach ($project->teamMembers as $member) {
        echo "- {$member->name} (Role: {$member->pivot->role})\n";
    }
    
    // Check if serialized correctly
    $serialized = $project->toArray();
    echo "\nSerialized team members count: " . count($serialized['team_members'] ?? []) . "\n";
} else {
    echo "Project not found\n";
}
