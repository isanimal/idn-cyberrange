<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lesson_assets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->string('type', 30)->default('IMAGE');
            $table->text('url');
            $table->string('caption')->nullable();
            $table->unsignedInteger('order_index')->default(1);
            $table->timestamps();

            $table->index(['lesson_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_assets');
    }
};
