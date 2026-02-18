<?php

namespace Database\Seeders;

use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WorkspaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing workspaces
        DB::table('workspace_invitations')->delete();
        DB::table('workspace_users')->delete();
        Workspace::query()->delete();

        // Get existing users
        $admin = User::where('email', 'admin@example.com')->first();
        $manager = User::where('email', 'manager@example.com')->first();
        $employee = User::where('email', 'employee@example.com')->first();

        if (!$admin) {
            $this->command->warn('Admin user not found. Please run UserSeeder first.');
            return;
        }

        // Create sample workspaces
        $workspaces = [
            [
                'name' => 'TechCorp Solutions',
                'slug' => 'techcorp-solutions',
                'description' => 'Digital transformation and software development workspace',
                'owner_id' => $admin->id,
                'join_code' => 'TECH2024',
                'is_active' => true,
                'settings' => [
                    'timezone' => 'UTC',
                    'date_format' => 'Y-m-d',
                    'currency' => 'USD',
                ],
            ],
            [
                'name' => 'Creative Agency',
                'slug' => 'creative-agency',
                'description' => 'Marketing and design collaboration workspace',
                'owner_id' => $manager ? $manager->id : $admin->id,
                'join_code' => 'CREATE24',
                'is_active' => true,
                'settings' => [
                    'timezone' => 'America/New_York',
                    'date_format' => 'm/d/Y',
                    'currency' => 'USD',
                ],
            ],
            [
                'name' => 'Startup Hub',
                'slug' => 'startup-hub',
                'description' => 'Innovation and startup project workspace',
                'owner_id' => $admin->id,
                'join_code' => 'START24',
                'is_active' => true,
                'settings' => [
                    'timezone' => 'Europe/London',
                    'date_format' => 'd/m/Y',
                    'currency' => 'EUR',
                ],
            ],
        ];

        $createdWorkspaces = [];
        foreach ($workspaces as $workspaceData) {
            $workspace = Workspace::create($workspaceData);
            $createdWorkspaces[] = $workspace;
            $this->command->info("Created workspace: {$workspace->name}");
        }

        // Assign users to workspaces
        foreach ($createdWorkspaces as $index => $workspace) {
            // Add owner as admin
            $workspace->addUser($workspace->owner, 'admin');

            // Add other users with different roles
            if ($manager && $workspace->owner_id !== $manager->id) {
                $workspace->addUser($manager, $index === 0 ? 'admin' : 'member');
            }

            if ($employee) {
                $workspace->addUser($employee, 'member');
            }

            $this->command->info("Added users to {$workspace->name}");
        }

        $this->command->info('Workspace seeding completed successfully!');
    }
}
