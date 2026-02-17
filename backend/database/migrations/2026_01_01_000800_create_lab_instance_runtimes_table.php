<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_instance_runtimes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('lab_instance_id')->unique()->constrained('lab_instances')->cascadeOnDelete();
            $table->string('workdir')->nullable();
            $table->string('compose_path')->nullable();
            $table->string('network_name')->nullable();
            $table->string('container_name')->nullable();
            $table->json('runtime_meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_instance_runtimes');
    }
};
