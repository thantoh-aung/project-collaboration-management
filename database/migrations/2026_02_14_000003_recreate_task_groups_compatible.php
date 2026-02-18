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
        // Don't drop the table, just add missing columns if needed
        if (!Schema::hasTable('task_groups')) {
            Schema::create('task_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->onDelete('cascade');
                $table->string('name');
                
                // Old column for backward compatibility
                $table->integer('order_column')->nullable();
                
                // New columns for Kanban system
                $table->enum('type', ['system', 'custom'])->default('custom');
                $table->integer('position')->default(0);
                
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();
                
                // Indexes
                $table->index(['project_id', 'position']);
                $table->index(['project_id', 'type']);
            });
        } else {
            // Table exists, add missing columns if needed
            Schema::table('task_groups', function (Blueprint $table) {
                if (!Schema::hasColumn('task_groups', 'order_column')) {
                    $table->integer('order_column')->nullable();
                }
                if (!Schema::hasColumn('task_groups', 'type')) {
                    $table->enum('type', ['system', 'custom'])->default('custom');
                }
                if (!Schema::hasColumn('task_groups', 'position')) {
                    $table->integer('position')->default(0);
                }
                if (!Schema::hasColumn('task_groups', 'archived_at')) {
                    $table->timestamp('archived_at')->nullable();
                }
                
                // Add indexes if they don't exist
                $table->index(['project_id', 'position']);
                $table->index(['project_id', 'type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_groups');
    }
};
