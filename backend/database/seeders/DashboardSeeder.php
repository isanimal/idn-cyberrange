<?php

namespace Database\Seeders;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Enums\SubmissionResult;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\Challenge;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin-dashboard@cyberrange.local'],
            [
                'name' => 'Admin Dashboard',
                'password' => 'password123',
                'role' => UserRole::ADMIN,
                'status' => UserStatus::ACTIVE,
            ]
        );

        $userA = User::query()->updateOrCreate(
            ['email' => 'dashboard-user-a@cyberrange.local'],
            [
                'name' => 'Dashboard User A',
                'password' => 'password123',
                'role' => UserRole::USER,
                'status' => UserStatus::ACTIVE,
            ]
        );

        $userB = User::query()->updateOrCreate(
            ['email' => 'dashboard-user-b@cyberrange.local'],
            [
                'name' => 'Dashboard User B',
                'password' => 'password123',
                'role' => UserRole::USER,
                'status' => UserStatus::ACTIVE,
            ]
        );

        $template = LabTemplate::query()->updateOrCreate(
            ['slug' => 'dashboard-lab', 'version' => '1.0.0'],
            [
                'template_family_uuid' => (string) Str::uuid(),
                'title' => 'Dashboard Lab',
                'difficulty' => 'EASY',
                'category' => 'Web Security',
                'short_description' => 'Lab for dashboard data.',
                'long_description' => '# Dashboard Lab',
                'estimated_time_minutes' => 45,
                'objectives' => ['Collect metrics'],
                'prerequisites' => ['Basic Linux'],
                'tags' => ['dashboard'],
                'assets' => [],
                'status' => LabTemplateStatus::PUBLISHED,
                'is_latest' => true,
                'published_at' => now(),
                'changelog' => [],
                'lab_summary' => ['type' => 'container'],
                'docker_image' => 'nginx:alpine',
                'internal_port' => 80,
                'configuration_type' => 'docker-compose',
                'configuration_content' => "services:\n  app:\n    image: nginx:alpine\n    ports:\n      - \"\\$".'{PORT}:80"'."\n",
                'configuration_base_port' => 80,
            ]
        );

        $challenge = Challenge::query()->updateOrCreate(
            ['lab_template_id' => $template->id, 'title' => 'Dashboard Flag'],
            [
                'description' => 'Seed challenge for dashboard submissions',
                'points' => 100,
                'flag_hash' => password_hash('FLAG{DASHBOARD}', PASSWORD_ARGON2ID),
                'max_attempts' => 10,
                'cooldown_seconds' => 1,
                'is_active' => true,
            ]
        );

        LabInstance::query()->updateOrCreate(
            ['user_id' => $userA->id, 'lab_template_id' => $template->id],
            [
                'template_version_pinned' => '1.0.0',
                'state' => LabInstanceState::ACTIVE,
                'progress_percent' => 50,
                'attempts_count' => 1,
                'notes' => '',
                'score' => 0,
                'started_at' => now()->subHours(2),
                'last_activity_at' => now(),
            ]
        );

        LabInstance::query()->updateOrCreate(
            ['user_id' => $userB->id, 'lab_template_id' => $template->id],
            [
                'template_version_pinned' => '1.0.0',
                'state' => LabInstanceState::ABANDONED,
                'progress_percent' => 10,
                'attempts_count' => 1,
                'notes' => '',
                'score' => 0,
                'started_at' => now()->subHours(5),
                'last_activity_at' => now()->subMinutes(30),
                'last_error' => 'Container crash loop',
            ]
        );

        for ($i = 0; $i < 7; $i++) {
            $day = now()->subDays(6 - $i)->setTime(12, 0);
            Submission::query()->updateOrCreate(
                [
                    'user_id' => $i % 2 === 0 ? $userA->id : $userB->id,
                    'challenge_id' => $challenge->id,
                    'attempt_no' => $i + 1,
                ],
                [
                    'submitted_hash' => hash('sha256', 'FLAG{SEED_'.$i.'}'),
                    'result' => $i % 3 === 0 ? SubmissionResult::WRONG : SubmissionResult::CORRECT,
                    'submitted_at' => $day,
                ]
            );
        }

        $actions = [
            'MODULE_UPDATED' => 'Updated module "SQL Injection"',
            'MODULE_CREATED' => 'Created module "HTTP Basics"',
            'LAB_TEMPLATE_PUBLISHED' => 'Published lab template "Dashboard Lab"',
            'USER_CREATED' => 'Created user "Dashboard User B"',
        ];

        foreach ($actions as $action => $message) {
            AuditLog::query()->create([
                'id' => (string) Str::uuid(),
                'actor_id' => $admin->id,
                'action' => $action,
                'target_type' => 'system',
                'target_id' => null,
                'metadata' => ['message' => $message],
                'created_at' => now()->subMinutes(random_int(1, 120)),
            ]);
        }
    }
}
