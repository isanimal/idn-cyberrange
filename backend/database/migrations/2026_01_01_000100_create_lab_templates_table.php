<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('template_family_uuid');
            $table->string('slug');
            $table->string('title');
            $table->string('difficulty', 50);
            $table->string('category', 100);
            $table->string('short_description', 500);
            $table->longText('long_description');
            $table->unsignedInteger('estimated_time_minutes');
            $table->json('objectives');
            $table->json('prerequisites');
            $table->json('tags');
            $table->string('version', 32);
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])->default('DRAFT');
            $table->boolean('is_latest')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->json('changelog')->nullable();
            $table->json('lab_summary')->nullable();

            $table->string('docker_image');
            $table->unsignedInteger('internal_port')->default(80);
            $table->json('env_vars')->nullable();
            $table->json('resource_limits')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['slug', 'is_latest']);
            $table->index(['template_family_uuid', 'is_latest']);
            $table->unique(['template_family_uuid', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_templates');
    }
};
