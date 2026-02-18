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
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['todo', 'in-progress', 'in-review', 'qa', 'done', 'deployed'])->default('todo')->after('description');
            $table->json('labels')->nullable()->after('status');
            $table->text('attachments')->nullable()->after('labels');
            $table->json('subscribers')->nullable()->after('attachments');
            $table->integer('time_estimate')->nullable()->comment('Time estimate in minutes')->after('estimation');
            $table->integer('time_spent')->nullable()->default(0)->comment('Time spent in minutes')->after('time_estimate');
            $table->timestamp('last_activity_at')->nullable()->after('archived_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'labels',
                'attachments',
                'subscribers',
                'time_estimate',
                'time_spent',
                'last_activity_at'
            ]);
        });
    }
};
