<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('task_groups', function (Blueprint $table) {
            // Add unique constraint to prevent duplicate group names per project
            $table->unique(['project_id', 'name'], 'task_groups_project_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_groups', function (Blueprint $table) {
            // Remove unique constraint
            $table->dropUnique('task_groups_project_name_unique');
        });
    }
};
