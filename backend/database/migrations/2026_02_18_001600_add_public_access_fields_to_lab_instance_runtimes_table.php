<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_instance_runtimes', function (Blueprint $table): void {
            if (! Schema::hasColumn('lab_instance_runtimes', 'host_port')) {
                $table->unsignedInteger('host_port')->nullable()->after('container_name');
            }
            if (! Schema::hasColumn('lab_instance_runtimes', 'public_host')) {
                $table->string('public_host')->nullable()->after('host_port');
            }
            if (! Schema::hasColumn('lab_instance_runtimes', 'access_url')) {
                $table->string('access_url')->nullable()->after('public_host');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lab_instance_runtimes', function (Blueprint $table): void {
            if (Schema::hasColumn('lab_instance_runtimes', 'access_url')) {
                $table->dropColumn('access_url');
            }
            if (Schema::hasColumn('lab_instance_runtimes', 'public_host')) {
                $table->dropColumn('public_host');
            }
            if (Schema::hasColumn('lab_instance_runtimes', 'host_port')) {
                $table->dropColumn('host_port');
            }
        });
    }
};
