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
            
            if (!in_array('client_id', $columnNames)) {
                $table->foreignId('client_id')->nullable()->constrained('users')->onDelete('set null');
            }
            
            if (!in_array('budget', $columnNames)) {
                $table->decimal('budget', 12, 2)->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn(['client_id', 'budget']);
        });
    }
};
