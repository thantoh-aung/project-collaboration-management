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
        Schema::table('project_user_access', function (Blueprint $table) {
            $table->string('role')->default('member')->after('user_id');
            $table->index(['project_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_user_access', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'user_id']);
            $table->dropColumn('role');
        });
    }
};
