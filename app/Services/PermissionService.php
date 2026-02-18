<?php

namespace App\Services;

class PermissionService
{
    /**
     * Get all permissions grouped by resource.
     *
     * @return array<string, array<string>>
     */
    public static function getAllPermissions(): array
    {
        return [
            // Projects
            'projects.view',
            'projects.create',
            'projects.edit',
            'projects.delete',
            'projects.archive',
            'projects.restore',

            // Tasks
            'tasks.view',
            'tasks.create',
            'tasks.edit',
            'tasks.delete',
            'tasks.assign',
            'tasks.archive',
            'tasks.restore',

            // Time Logs
            'time-logs.view',
            'time-logs.create',
            'time-logs.edit',
            'time-logs.delete',

            // Reports
            'reports.view',
            'reports.export',

            // Invoices
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',

            // Client Companies
            'client-companies.view',
            'client-companies.create',
            'client-companies.edit',
            'client-companies.delete',

            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Settings
            'settings.view',
            'settings.edit',
        ];
    }

    /**
     * Get permissions for a specific role.
     *
     * @param string $roleName
     * @return array<string>
     */
    public static function getPermissionsForRole(string $roleName): array
    {
        return match ($roleName) {
            'admin' => self::getAdminPermissions(),
            'manager' => self::getManagerPermissions(),
            'developer' => self::getDeveloperPermissions(),
            'qa-engineer' => self::getQAEngineerPermissions(),
            'designer' => self::getDesignerPermissions(),
            'client' => self::getClientPermissions(),
            default => [],
        };
    }

    /**
     * Get permissions for Admin role.
     * Full access to everything.
     *
     * @return array<string>
     */
    protected static function getAdminPermissions(): array
    {
        return self::getAllPermissions();
    }

    /**
     * Get permissions for Manager role.
     * Projects, tasks, reports.
     *
     * @return array<string>
     */
    protected static function getManagerPermissions(): array
    {
        return [
            // Projects
            'projects.view',
            'projects.create',
            'projects.edit',
            'projects.delete',
            'projects.archive',
            'projects.restore',

            // Tasks
            'tasks.view',
            'tasks.create',
            'tasks.edit',
            'tasks.delete',
            'tasks.assign',
            'tasks.archive',
            'tasks.restore',

            // Time Logs
            'time-logs.view',
            'time-logs.create',
            'time-logs.edit',
            'time-logs.delete',

            // Reports
            'reports.view',
            'reports.export',

            // Invoices
            'invoices.view',
            'invoices.create',
            'invoices.edit',

            // Client Companies
            'client-companies.view',
            'client-companies.create',
            'client-companies.edit',

            // Users
            'users.view',
        ];
    }

    /**
     * Get permissions for Developer role.
     * View projects, manage assigned tasks, log time.
     *
     * @return array<string>
     */
    protected static function getDeveloperPermissions(): array
    {
        return [
            // Projects
            'projects.view',

            // Tasks (only assigned)
            'tasks.view',
            'tasks.edit', // Only assigned tasks
            'tasks.archive', // Only assigned tasks

            // Time Logs
            'time-logs.view',
            'time-logs.create',
            'time-logs.edit',
            'time-logs.delete', // Own time logs only
        ];
    }

    /**
     * Get permissions for QA Engineer role.
     * View projects, create/edit tasks, log time.
     *
     * @return array<string>
     */
    protected static function getQAEngineerPermissions(): array
    {
        return [
            // Projects
            'projects.view',

            // Tasks
            'tasks.view',
            'tasks.create',
            'tasks.edit',
            'tasks.archive',

            // Time Logs
            'time-logs.view',
            'time-logs.create',
            'time-logs.edit',
            'time-logs.delete', // Own time logs only
        ];
    }

    /**
     * Get permissions for Designer role.
     * Similar to developer.
     *
     * @return array<string>
     */
    protected static function getDesignerPermissions(): array
    {
        return [
            // Projects
            'projects.view',

            // Tasks (only assigned)
            'tasks.view',
            'tasks.edit', // Only assigned tasks
            'tasks.archive', // Only assigned tasks

            // Time Logs
            'time-logs.view',
            'time-logs.create',
            'time-logs.edit',
            'time-logs.delete', // Own time logs only
        ];
    }

    /**
     * Get permissions for Client role.
     * View projects and tasks only.
     *
     * @return array<string>
     */
    protected static function getClientPermissions(): array
    {
        return [
            // Projects
            'projects.view',

            // Tasks
            'tasks.view',
        ];
    }

    /**
     * Get all role names.
     *
     * @return array<string>
     */
    public static function getRoleNames(): array
    {
        return [
            'admin',
            'manager',
            'developer',
            'qa-engineer',
            'designer',
            'client',
        ];
    }
}
