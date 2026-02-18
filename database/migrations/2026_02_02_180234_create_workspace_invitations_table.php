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
        // Add missing indexes if the table already exists (idempotent)
        if (Schema::hasTable('workspace_invitations')) {
            Schema::table('workspace_invitations', function (Blueprint $table) {
                $table->index(['workspace_id', 'email']);
                $table->index('token');
            });
        } else {
            // Fallback: create the table if it doesn't exist (for safety)
            Schema::create('workspace_invitations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
                $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
                $table->string('email');
                $table->enum('role', ['admin', 'member', 'client'])->default('member');
                $table->string('token')->unique();
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('expires_at');
                $table->timestamps();
                
                $table->index(['workspace_id', 'email']);
                $table->index('token');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workspace_invitations');
    }
};
