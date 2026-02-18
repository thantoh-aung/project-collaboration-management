<?php

namespace Database\Seeders;

use App\Services\PermissionService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = PermissionService::getRoleNames();

        foreach ($roles as $roleName) {
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web']
            );

            // Get permissions for this role
            $permissions = PermissionService::getPermissionsForRole($roleName);

            // Sync permissions to role
            $role->syncPermissions($permissions);

            $this->command->info("Role '{$roleName}' created with " . count($permissions) . " permissions.");
        }

        $this->command->info('Roles seeded successfully.');
    }
}
