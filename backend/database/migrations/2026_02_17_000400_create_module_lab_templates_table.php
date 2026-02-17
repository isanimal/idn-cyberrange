<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('module_lab_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignUuid('lab_template_id')->constrained('lab_templates')->cascadeOnDelete();
            $table->unsignedInteger('order')->default(1);
            $table->string('type', 20)->default('LAB');
            $table->boolean('required')->default(false);
            $table->timestamps();

            $table->unique(['module_id', 'lab_template_id']);
            $table->index(['module_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_lab_templates');
    }
};
