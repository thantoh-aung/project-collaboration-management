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
        Schema::table('projects', function (Blueprint $table) {
            // Check if columns exist before adding them
            $columns = DB::select("SHOW COLUMNS FROM projects");
            $columnNames = array_column($columns, 'Field');
            
            if (!in_array('status', $columnNames)) {
                $table->string('status')->default('active')->after('description');
            }
            
            if (!in_array('priority', $columnNames)) {
                $table->string('priority')->default('medium')->after('status');
            }
            
            if (!in_array('progress', $columnNames)) {
                $table->integer('progress')->default(0)->after('priority');
            }
            
            if (!in_array('start_date', $columnNames)) {
                $table->date('start_date')->nullable()->after('progress');
            }
            
            if (!in_array('due_date', $columnNames)) {
                $table->date('due_date')->nullable()->after('start_date');
            }
            
            if (!in_array('workspace_id', $columnNames)) {
                $table->unsignedBigInteger('workspace_id')->nullable()->after('due_date');
                $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            }
            
            if (!in_array('created_by', $columnNames)) {
                $table->unsignedBigInteger('created_by')->nullable()->after('workspace_id');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['workspace_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['status', 'priority', 'progress', 'start_date', 'due_date', 'workspace_id', 'created_by']);
        });
    }
};
