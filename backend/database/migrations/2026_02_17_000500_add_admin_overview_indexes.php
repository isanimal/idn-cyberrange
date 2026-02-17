<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table): void {
            $table->index('submitted_at', 'submissions_submitted_at_idx');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index('created_at', 'audit_logs_created_at_idx');
        });

        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->index(['state', 'updated_at'], 'lab_instances_state_updated_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->dropIndex('lab_instances_state_updated_at_idx');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_created_at_idx');
        });

        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropIndex('submissions_submitted_at_idx');
        });
    }
};
