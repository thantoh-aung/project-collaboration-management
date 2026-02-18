<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('freelancer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug')->unique()->nullable();
            $table->string('title')->nullable();
            $table->text('bio')->nullable();
            $table->json('skills')->nullable();
            $table->json('portfolio_links')->nullable();
            $table->decimal('rate_min', 10, 2)->nullable();
            $table->decimal('rate_max', 10, 2)->nullable();
            $table->string('rate_currency', 3)->default('USD');
            $table->string('availability')->default('available'); // available, limited, unavailable
            $table->string('country')->nullable();
            $table->string('timezone')->nullable();
            $table->string('status')->default('draft'); // draft, published
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('total_projects')->default(0);
            $table->decimal('avg_rating', 3, 2)->default(0.00);
            $table->timestamps();

            $table->index('status');
            $table->index('availability');
            $table->index('avg_rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freelancer_profiles');
    }
};
