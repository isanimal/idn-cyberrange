<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('lab_template_id')->constrained('lab_templates')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->unsignedInteger('points')->default(0);
            $table->string('flag_hash');
            $table->unsignedInteger('max_attempts')->default(10);
            $table->unsignedInteger('cooldown_seconds')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
