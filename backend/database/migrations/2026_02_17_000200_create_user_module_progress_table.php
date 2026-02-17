<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('user_module_progress')) {
            Schema::create('user_module_progress', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('module_id')->constrained('modules')->cascadeOnDelete();
                $table->unsignedTinyInteger('progress_percent')->default(0);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('last_accessed_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'module_id']);
                $table->index(['user_id', 'completed_at']);
            });
        }

        if (Schema::hasTable('module_progress')) {
            DB::table('module_progress')->orderBy('id')->chunk(200, function ($rows): void {
                foreach ($rows as $row) {
                    $existing = DB::table('user_module_progress')
                        ->where('user_id', $row->user_id)
                        ->where('module_id', $row->module_id)
                        ->first();

                    $payload = [
                        'progress_percent' => (int) $row->progress_percent,
                        'started_at' => $row->created_at ?? now(),
                        'completed_at' => ! empty($row->is_completed) ? ($row->updated_at ?? now()) : null,
                        'last_accessed_at' => $row->last_accessed_at,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ];

                    if ($existing) {
                        DB::table('user_module_progress')
                            ->where('id', $existing->id)
                            ->update($payload);
                    } else {
                        DB::table('user_module_progress')->insert([
                            'id' => (string) Str::uuid(),
                            'user_id' => $row->user_id,
                            'module_id' => $row->module_id,
                            ...$payload,
                        ]);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_module_progress');
    }
};
