<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\TaskGroup;
use Illuminate\Support\Facades\DB;

class DefaultTaskGroupsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all projects
        $projects = Project::all();

        $defaultGroups = [
            ['name' => 'To Do', 'order_column' => 1],
            ['name' => 'In Progress', 'order_column' => 2],
            ['name' => 'Complete', 'order_column' => 3],
        ];

        foreach ($projects as $project) {
            // Remove all existing task groups for this project
            TaskGroup::where('project_id', $project->id)->delete();
            
            // Create only the 3 default groups
            foreach ($defaultGroups as $groupData) {
                TaskGroup::create([
                    'project_id' => $project->id,
                    'name' => $groupData['name'],
                    'order_column' => $groupData['order_column'],
                ]);
            }
        }
    }
}
