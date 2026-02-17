<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table): void {
            if (! Schema::hasColumn('modules', 'difficulty')) {
                $table->string('difficulty', 20)->default('BASIC')->after('description');
            }

            if (! Schema::hasColumn('modules', 'category')) {
                $table->string('category', 120)->default('Web')->after('difficulty');
            }

            if (! Schema::hasColumn('modules', 'est_minutes')) {
                $table->unsignedInteger('est_minutes')->default(30)->after('category');
            }

            if (! Schema::hasColumn('modules', 'version')) {
                $table->string('version', 32)->default('0.1.0')->after('status');
            }

            if (! Schema::hasColumn('modules', 'tags')) {
                $table->json('tags')->nullable()->after('version');
            }

            if (! Schema::hasColumn('modules', 'cover_icon')) {
                $table->string('cover_icon')->nullable()->after('tags');
            }

            if (! Schema::hasColumn('modules', 'created_by')) {
                $table->foreignUuid('created_by')->nullable()->after('cover_icon')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('modules', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('created_by');
            }
        });

        DB::table('modules')->select(['id', 'level', 'status'])->orderBy('id')->chunk(200, function ($rows): void {
            foreach ($rows as $row) {
                $difficulty = match (strtolower((string) $row->level)) {
                    'intermediate' => 'INTERMEDIATE',
                    'advanced' => 'ADVANCED',
                    default => 'BASIC',
                };

                $status = strtolower((string) $row->status);
                $archivedAt = null;

                if ($status === 'archived') {
                    $archivedAt = now();
                    $status = 'active';
                }

                DB::table('modules')->where('id', $row->id)->update([
                    'difficulty' => $difficulty,
                    'status' => in_array($status, ['active', 'locked', 'draft'], true) ? $status : 'draft',
                    'archived_at' => $archivedAt,
                ]);
            }
        });

        Schema::table('lessons', function (Blueprint $table): void {
            if (! Schema::hasColumn('lessons', 'content_md')) {
                $table->longText('content_md')->nullable()->after('content_markdown');
            }

            if (! Schema::hasColumn('lessons', 'order')) {
                $table->unsignedInteger('order')->default(1)->after('content_md');
            }

            if (! Schema::hasColumn('lessons', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('order');
            }
        });

        DB::table('lessons')->select(['id', 'content', 'content_markdown', 'order_index'])->orderBy('id')->chunk(200, function ($rows): void {
            foreach ($rows as $row) {
                DB::table('lessons')->where('id', $row->id)->update([
                    'content_md' => $row->content_markdown ?? $row->content,
                    'order' => $row->order_index ?: 1,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            if (Schema::hasColumn('lessons', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('lessons', 'order')) {
                $table->dropColumn('order');
            }
            if (Schema::hasColumn('lessons', 'content_md')) {
                $table->dropColumn('content_md');
            }
        });

        Schema::table('modules', function (Blueprint $table): void {
            if (Schema::hasColumn('modules', 'archived_at')) {
                $table->dropColumn('archived_at');
            }
            if (Schema::hasColumn('modules', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
            if (Schema::hasColumn('modules', 'cover_icon')) {
                $table->dropColumn('cover_icon');
            }
            if (Schema::hasColumn('modules', 'tags')) {
                $table->dropColumn('tags');
            }
            if (Schema::hasColumn('modules', 'version')) {
                $table->dropColumn('version');
            }
            if (Schema::hasColumn('modules', 'est_minutes')) {
                $table->dropColumn('est_minutes');
            }
            if (Schema::hasColumn('modules', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('modules', 'difficulty')) {
                $table->dropColumn('difficulty');
            }
        });
    }
};
