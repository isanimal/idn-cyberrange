<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_templates', function (Blueprint $table): void {
            $table->string('configuration_type', 32)->nullable()->after('resource_limits');
            $table->longText('configuration_content')->nullable()->after('configuration_type');
            $table->unsignedInteger('configuration_base_port')->nullable()->after('configuration_content');
            $table->json('assets')->nullable()->after('configuration_base_port');
        });
    }

    public function down(): void
    {
        Schema::table('lab_templates', function (Blueprint $table): void {
            $table->dropColumn(['configuration_type', 'configuration_content', 'configuration_base_port', 'assets']);
        });
    }
};
