<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lesson_tasks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('order_index')->default(1);
            $table->unsignedInteger('points')->nullable();
            $table->timestamps();

            $table->index(['lesson_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_tasks');
    }
};
