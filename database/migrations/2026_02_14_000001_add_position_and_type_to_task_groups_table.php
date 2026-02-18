<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table exists, so we just need to ensure it has the correct structure
        // The table was recreated with the correct structure, so we're done
        $this->ensureTableStructure();
    }
    
    private function ensureTableStructure(): void
    {
        // Check if type column exists, add it if it doesn't
        try {
            DB::statement("SELECT `type` FROM `task_groups` LIMIT 1");
        } catch (\Exception $e) {
            // Column doesn't exist, add it
            DB::statement("ALTER TABLE `task_groups` ADD COLUMN `type` ENUM('system', 'custom') NOT NULL DEFAULT 'custom' AFTER `name`");
        }
        
        // Check if position column exists, add it if it doesn't
        try {
            DB::statement("SELECT `position` FROM `task_groups` LIMIT 1");
        } catch (\Exception $e) {
            // Column doesn't exist, add it
            DB::statement("ALTER TABLE `task_groups` ADD COLUMN `position` INT NOT NULL AFTER `type`");
        }
        
        // Drop order_column if it exists
        try {
            DB::statement("ALTER TABLE `task_groups` DROP COLUMN `order_column`");
        } catch (\Exception $e) {
            // Column doesn't exist, which is fine
        }
        
        // Add indexes if they don't exist
        try {
            DB::statement("ALTER TABLE `task_groups` ADD INDEX `task_groups_project_id_position_index` (`project_id`, `position`)");
        } catch (\Exception $e) {
            // Index might already exist, which is fine
        }
        
        try {
            DB::statement("ALTER TABLE `task_groups` ADD INDEX `task_groups_project_id_type_index` (`project_id`, `type`)");
        } catch (\Exception $e) {
            // Index might already exist, which is fine
        }
    }
    
    private function recreateTable(): void
    {
        // Drop existing table if it exists
        try {
            DB::statement("DROP TABLE IF EXISTS `task_groups`");
        } catch (\Exception $e) {
            // Table doesn't exist, which is fine
        }
        
        // Create the table with all required columns
        DB::statement("
            CREATE TABLE `task_groups` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `project_id` bigint unsigned NOT NULL,
                `name` varchar(255) NOT NULL,
                `type` enum('system', 'custom') NOT NULL DEFAULT 'custom',
                `position` int NOT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                KEY `task_groups_project_id_foreign` (`project_id`),
                KEY `task_groups_project_id_position_index` (`project_id`, `position`),
                KEY `task_groups_project_id_type_index` (`project_id`, `type`),
                CONSTRAINT `task_groups_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_groups', function (Blueprint $table) {
            // Restore the old order_column
            $table->integer('order_column')->nullable();
            
            // Drop the new fields
            $table->dropIndex(['project_id', 'position']);
            $table->dropIndex(['project_id', 'type']);
            $table->dropColumn(['type', 'position']);
        });
    }
};
