<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('user_module_progress')) {
            return;
        }

        Schema::table('user_module_progress', function (Blueprint $table): void {
            if (! Schema::hasColumn('user_module_progress', 'last_lesson_id')) {
                $table->foreignUuid('last_lesson_id')->nullable()->after('last_accessed_at');
                $table->foreign('last_lesson_id')->references('id')->on('lessons')->nullOnDelete();
                $table->index(['user_id', 'module_id', 'last_lesson_id'], 'ump_user_module_last_lesson_idx');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('user_module_progress')) {
            return;
        }

        Schema::table('user_module_progress', function (Blueprint $table): void {
            if (Schema::hasColumn('user_module_progress', 'last_lesson_id')) {
                $table->dropForeign(['last_lesson_id']);
                $table->dropIndex('ump_user_module_last_lesson_idx');
                $table->dropColumn('last_lesson_id');
            }
        });
    }
};
