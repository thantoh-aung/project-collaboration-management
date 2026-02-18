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
        Schema::table('project_posts', function (Blueprint $table) {
            // Increase budget columns to handle larger values
            // decimal(15, 2) allows up to 999,999,999,999,999.99 (13 digits before decimal)
            $table->decimal('budget_min', 15, 2)->nullable()->change();
            $table->decimal('budget_max', 15, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_posts', function (Blueprint $table) {
            $table->decimal('budget_min', 10, 2)->nullable()->change();
            $table->decimal('budget_max', 10, 2)->nullable()->change();
        });
    }
};
