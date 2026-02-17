<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('port_allocations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->unsignedInteger('port')->unique();
            $table->foreignUuid('lab_instance_id')->nullable()->constrained('lab_instances')->nullOnDelete();
            $table->enum('status', ['ASSIGNED', 'RELEASED'])->default('ASSIGNED');
            $table->timestamp('allocated_at')->useCurrent();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index(['lab_instance_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('port_allocations');
    }
};
