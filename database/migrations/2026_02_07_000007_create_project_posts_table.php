<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->decimal('budget_min', 10, 2)->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->string('budget_type')->default('fixed'); // fixed, hourly, milestone
            $table->string('budget_currency', 3)->default('USD');
            $table->date('deadline')->nullable();
            $table->json('skills_required')->nullable();
            $table->string('status')->default('open'); // open, in_progress, closed
            $table->string('country')->nullable();
            $table->string('timezone')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_posts');
    }
};
