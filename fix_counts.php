<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\FreelancerProfile;
use App\Models\PreProjectChat;

foreach (FreelancerProfile::all() as $p) {
    $count = PreProjectChat::where('freelancer_id', $p->user_id)
        ->where('status', 'converted_to_workspace')
        ->whereNotNull('workspace_id')
        ->count();
    
    $p->update(['total_projects' => $count]);
    echo "Updated {$p->user->name}: {$count}\n";
}
