<?php

namespace Database\Seeders;

use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Challenge;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@cyberrange.local'],
            [
                'name' => 'Admin',
                'password' => 'password123',
                'role' => UserRole::ADMIN,
                'status' => UserStatus::ACTIVE,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'user@cyberrange.local'],
            [
                'name' => 'Learner',
                'password' => 'password123',
                'role' => UserRole::USER,
                'status' => UserStatus::ACTIVE,
            ]
        );

        $lab = LabTemplate::query()->updateOrCreate(
            ['slug' => 'dvwa-docker', 'version' => '2026.1.0'],
            [
                'template_family_uuid' => '11111111-1111-1111-1111-111111111111',
                'title' => 'Damn Vulnerable Web Application',
                'difficulty' => 'EASY',
                'category' => 'Web Security',
                'short_description' => 'Learn SQLi and XSS in a vulnerable PHP app.',
                'long_description' => '# DVWA\nPractice exploitation in a safe environment.',
                'estimated_time_minutes' => 60,
                'objectives' => ['SQL Injection', 'XSS'],
                'prerequisites' => ['HTTP Basics'],
                'tags' => ['OWASP', 'PHP'],
                'status' => LabTemplateStatus::PUBLISHED,
                'is_latest' => true,
                'published_at' => now(),
                'changelog' => [[
                    'version' => '2026.1.0',
                    'date' => now()->toDateString(),
                    'notes' => 'Initial release',
                ]],
                'lab_summary' => ['type' => 'web', 'stack' => ['php', 'mysql']],
                'docker_image' => 'vulnerables/web-dvwa',
                'internal_port' => 80,
                'env_vars' => ['APP_ENV' => 'training'],
                'resource_limits' => ['memory' => '512m', 'cpus' => '0.5'],
            ]
        );

        Challenge::query()->updateOrCreate(
            ['lab_template_id' => $lab->id, 'title' => 'Find SQLi Flag'],
            [
                'description' => 'Exploit SQL injection and retrieve the admin flag.',
                'points' => 100,
                'flag_hash' => password_hash('FLAG{DVWA_SQLI}', PASSWORD_ARGON2ID),
                'max_attempts' => 10,
                'cooldown_seconds' => 30,
                'is_active' => true,
            ]
        );
    }
}
