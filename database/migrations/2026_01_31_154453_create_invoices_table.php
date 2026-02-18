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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_company_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by_user_id')->constrained('users')->onDelete('cascade');
            $table->string('number')->unique();
            $table->string('status')->default('draft');
            $table->string('type')->default('invoice');
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('amount_with_tax', 10, 2)->default(0);
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->date('due_date')->nullable();
            $table->text('note')->nullable();
            $table->string('filename')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
