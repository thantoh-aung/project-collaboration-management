<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FixProjectAccess extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-project-access';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix project access by adding creators as admins';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projects = \App\Models\Project::all();
        
        foreach ($projects as $project) {
            // Check if creator is already a team member
            $isMember = $project->teamMembers()->where('user_id', $project->created_by)->exists();
            
            if (!$isMember) {
                $project->teamMembers()->attach($project->created_by, ['role' => 'admin']);
                $this->info("Added creator as admin to project: {$project->name} (ID: {$project->id})");
            } else {
                // Update existing role to admin if not already
                $member = $project->teamMembers()->where('user_id', $project->created_by)->first();
                if ($member->pivot->role !== 'admin') {
                    $project->teamMembers()->updateExistingPivot($project->created_by, ['role' => 'admin']);
                    $this->info("Updated creator role to admin for project: {$project->name} (ID: {$project->id})");
                } else {
                    $this->line("Creator already admin for project: {$project->name} (ID: {$project->id})");
                }
            }
        }
        
        $this->info('Project access fixed successfully!');
    }
}
