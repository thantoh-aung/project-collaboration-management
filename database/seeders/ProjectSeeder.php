<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing projects
        DB::table('project_user_access')->delete();
        Project::query()->delete();

        // Get existing users and workspaces
        $admin = User::where('email', 'admin@example.com')->first();
        $manager = User::where('email', 'manager@example.com')->first();
        $employee = User::where('email', 'employee@example.com')->first();

        // Get first workspace for projects
        $workspace = \App\Models\Workspace::first();

        if (!$admin) {
            $this->command->warn('Admin user not found. Please run UserSeeder first.');
            return;
        }

        // Create sample projects
        $projects = [
            [
                'name' => 'Website Redesign',
                'description' => 'Complete redesign of the company website with modern UI/UX principles and responsive design.',
                'workspace_id' => $workspace ? $workspace->id : null,
                'client_company_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mobile App Development',
                'description' => 'Native mobile application for iOS and Android platforms with real-time synchronization.',
                'workspace_id' => $workspace ? $workspace->id : null,
                'client_company_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Marketing Campaign',
                'description' => 'Digital marketing campaign including social media, email marketing, and content creation.',
                'workspace_id' => $workspace ? $workspace->id : null,
                'client_company_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'API Integration',
                'description' => 'Integration of third-party APIs for payment processing and data analytics.',
                'workspace_id' => $workspace ? $workspace->id : null,
                'client_company_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Database Optimization',
                'description' => 'Performance optimization and migration of legacy database systems.',
                'workspace_id' => $workspace ? $workspace->id : null,
                'client_company_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        $createdProjects = [];
        foreach ($projects as $projectData) {
            $project = Project::create($projectData);
            $createdProjects[] = $project;
            $this->command->info("Created project: {$project->name}");
        }

        // Assign team members to projects
        foreach ($createdProjects as $index => $project) {
            $teamMembers = [$admin->id];
            
            if ($manager) {
                $teamMembers[] = $manager->id;
            }
            
            if ($employee && $index < 3) {
                $teamMembers[] = $employee->id;
            }

            $project->teamMembers()->attach($teamMembers, [
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info("Assigned " . count($teamMembers) . " team members to {$project->name}");
        }

        $this->command->info('Project seeding completed successfully!');
    }
}
