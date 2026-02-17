<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_instances', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('lab_template_id')->constrained('lab_templates')->cascadeOnDelete();
            $table->string('template_version_pinned', 32);
            $table->enum('state', ['INACTIVE', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'])->default('INACTIVE');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->unsignedInteger('attempts_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('assigned_port')->nullable();
            $table->string('connection_url')->nullable();
            $table->json('runtime_metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'state']);
            $table->index(['lab_template_id']);
            $table->unique(['user_id', 'lab_template_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_instances');
    }
};
