<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freelancer_profiles', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('slug');
            $table->string('github_link')->nullable()->after('portfolio_links');
            $table->string('linkedin_link')->nullable()->after('github_link');
            $table->string('website_link')->nullable()->after('linkedin_link');
        });
    }

    public function down(): void
    {
        Schema::table('freelancer_profiles', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'github_link', 'linkedin_link', 'website_link']);
        });
    }
};
