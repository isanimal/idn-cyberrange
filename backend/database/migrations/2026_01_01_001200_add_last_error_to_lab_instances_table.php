<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->text('last_error')->nullable()->after('runtime_metadata');
        });
    }

    public function down(): void
    {
        Schema::table('lab_instances', function (Blueprint $table): void {
            $table->dropColumn('last_error');
        });
    }
};

