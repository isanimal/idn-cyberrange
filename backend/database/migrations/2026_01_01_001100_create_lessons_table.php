<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('module_id')->constrained('modules')->cascadeOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->unsignedInteger('order_index')->default(1);
            $table->timestamps();

            $table->index(['module_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};

