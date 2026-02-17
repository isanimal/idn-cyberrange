<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->enum('level', ['basic', 'intermediate', 'advanced'])->default('basic');
            $table->enum('status', ['active', 'locked', 'draft'])->default('draft');
            $table->unsignedInteger('order_index')->default(1);
            $table->timestamps();

            $table->index(['status', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};

