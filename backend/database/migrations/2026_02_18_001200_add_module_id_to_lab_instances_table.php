<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->foreignUuid('module_id')->nullable()->after('user_id')->constrained('modules')->nullOnDelete();
            $table->index(['module_id']);
        });
    }

    public function down(): void
    {
        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('module_id');
        });
    }
};
