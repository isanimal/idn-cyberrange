<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('port_allocations', function (Blueprint $table): void {
            if (! Schema::hasColumn('port_allocations', 'active_port')) {
                $table->unsignedInteger('active_port')->nullable()->after('port');
            }
        });

        DB::statement("UPDATE port_allocations SET active_port = port WHERE status = 'ASSIGNED'");
        DB::statement("UPDATE port_allocations SET active_port = NULL WHERE status <> 'ASSIGNED' OR status IS NULL");

        try {
            Schema::table('port_allocations', function (Blueprint $table): void {
                $table->dropUnique('port_allocations_port_unique');
            });
        } catch (\Throwable) {
            // no-op when index already dropped
        }

        try {
            Schema::table('port_allocations', function (Blueprint $table): void {
                $table->dropIndex('port_allocations_port_index');
            });
        } catch (\Throwable) {
            // no-op when index does not exist
        }

        Schema::table('port_allocations', function (Blueprint $table): void {
            $table->index('port', 'port_allocations_port_index');
            $table->unique('active_port', 'port_allocations_active_port_unique');
        });
    }

    public function down(): void
    {
        try {
            Schema::table('port_allocations', function (Blueprint $table): void {
                $table->dropUnique('port_allocations_active_port_unique');
            });
        } catch (\Throwable) {
            // no-op
        }

        try {
            Schema::table('port_allocations', function (Blueprint $table): void {
                $table->dropIndex('port_allocations_port_index');
            });
        } catch (\Throwable) {
            // no-op
        }

        Schema::table('port_allocations', function (Blueprint $table): void {
            $table->unique('port', 'port_allocations_port_unique');
            if (Schema::hasColumn('port_allocations', 'active_port')) {
                $table->dropColumn('active_port');
            }
        });
    }
};
