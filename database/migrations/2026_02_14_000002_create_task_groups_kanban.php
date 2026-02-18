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
        // Create the task_groups table with the correct structure
        DB::statement('
            CREATE TABLE task_groups (
                id bigint unsigned NOT NULL AUTO_INCREMENT,
                project_id bigint unsigned NOT NULL,
                name varchar(255) NOT NULL,
                type enum("system", "custom") NOT NULL DEFAULT "custom",
                position int NOT NULL,
                created_at timestamp NULL DEFAULT NULL,
                updated_at timestamp NULL DEFAULT NULL,
                PRIMARY KEY (id),
                KEY task_groups_project_id_foreign (project_id),
                KEY task_groups_project_id_position_index (project_id, position),
                KEY task_groups_project_id_type_index (project_id, type),
                CONSTRAINT task_groups_project_id_foreign FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_groups');
    }
};
