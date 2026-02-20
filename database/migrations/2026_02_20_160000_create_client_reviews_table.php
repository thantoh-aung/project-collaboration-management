<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('freelancer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('workspace_id')->nullable()->constrained()->onDelete('set null');
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'freelancer_id']); // One review per freelancer per client
        });

        // Add avg_rating to client_profiles
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->decimal('avg_rating', 3, 2)->default(0)->after('total_projects');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_reviews');

        Schema::table('client_profiles', function (Blueprint $table) {
            $table->dropColumn('avg_rating');
        });
    }
};
