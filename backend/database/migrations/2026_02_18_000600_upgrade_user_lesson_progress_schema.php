<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('user_lesson_progress')) {
            return;
        }

        Schema::table('user_lesson_progress', function (Blueprint $table): void {
            if (! Schema::hasColumn('user_lesson_progress', 'status')) {
                $table->string('status', 20)->default('NOT_STARTED')->after('lesson_id');
            }

            if (! Schema::hasColumn('user_lesson_progress', 'percent')) {
                $table->unsignedTinyInteger('percent')->default(0)->after('status');
            }

            if (! Schema::hasColumn('user_lesson_progress', 'started_at')) {
                $table->timestamp('started_at')->nullable()->after('percent');
            }

            if (! Schema::hasColumn('user_lesson_progress', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('completed_at');
            }
        });

        DB::table('user_lesson_progress')
            ->select(['id', 'is_completed', 'completed_at'])
            ->orderBy('id')
            ->chunk(500, function ($rows): void {
                foreach ($rows as $row) {
                    $isCompleted = (bool) ($row->is_completed ?? false);

                    DB::table('user_lesson_progress')
                        ->where('id', $row->id)
                        ->update([
                            'status' => $isCompleted ? 'COMPLETED' : 'NOT_STARTED',
                            'percent' => $isCompleted ? 100 : 0,
                            'started_at' => $isCompleted ? ($row->completed_at ?? now()) : null,
                            'last_seen_at' => $row->completed_at,
                        ]);
                }
            });

        Schema::table('user_lesson_progress', function (Blueprint $table): void {
            if (! Schema::hasColumn('user_lesson_progress', 'status') || ! Schema::hasColumn('user_lesson_progress', 'lesson_id')) {
                return;
            }

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('user_lesson_progress')) {
            return;
        }

        Schema::table('user_lesson_progress', function (Blueprint $table): void {
            if (Schema::hasColumn('user_lesson_progress', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }

            if (Schema::hasColumn('user_lesson_progress', 'started_at')) {
                $table->dropColumn('started_at');
            }

            if (Schema::hasColumn('user_lesson_progress', 'percent')) {
                $table->dropColumn('percent');
            }

            if (Schema::hasColumn('user_lesson_progress', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
