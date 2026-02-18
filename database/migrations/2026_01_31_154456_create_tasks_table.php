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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('task_groups')->onDelete('set null');
            $table->foreignId('created_by_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('number')->nullable();
            $table->text('description')->nullable();
            $table->date('due_on')->nullable();
            $table->integer('estimation')->nullable(); // in minutes
            $table->enum('pricing_type', ['hourly', 'fixed'])->default('hourly');
            $table->decimal('fixed_price', 10, 2)->nullable();
            $table->boolean('hidden_from_clients')->default(false);
            $table->boolean('billable')->default(true);
            $table->integer('order_column')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
