<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collaboration_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaboration_id')->constrained('freelancer_collaborations')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->string('type')->default('text'); // text, image, file, voice
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->integer('file_size')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index('collaboration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collaboration_messages');
    }
};
