<?php

namespace Database\Seeders;

use App\Enums\LabTemplateStatus;
use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\LabTemplate;
use App\Models\Module;
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
            ['email' => 'user1@cyberrange.local'],
            [
                'name' => 'Learner One',
                'password' => 'password123',
                'role' => UserRole::USER,
                'status' => UserStatus::ACTIVE,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'user2@cyberrange.local'],
            [
                'name' => 'Learner Two',
                'password' => 'password123',
                'role' => UserRole::USER,
                'status' => UserStatus::ACTIVE,
            ]
        );

        $labs = [
            [
                'family' => '11111111-1111-1111-1111-111111111111',
                'slug' => 'dvwa-docker',
                'title' => 'DVWA Web Pentest',
                'difficulty' => 'EASY',
                'category' => 'Web Security',
                'version' => '2026.1.0',
                'status' => LabTemplateStatus::PUBLISHED,
                'base_port' => 80,
                'image' => 'vulnerables/web-dvwa',
            ],
            [
                'family' => '22222222-2222-2222-2222-222222222222',
                'slug' => 'ssti-playground',
                'title' => 'SSTI Playground',
                'difficulty' => 'MEDIUM',
                'category' => 'Web Security',
                'version' => '2026.1.0',
                'status' => LabTemplateStatus::PUBLISHED,
                'base_port' => 3000,
                'image' => 'node:20-alpine',
            ],
            [
                'family' => '33333333-3333-3333-3333-333333333333',
                'slug' => 'proto-reverse',
                'title' => 'Protocol Reverse Draft',
                'difficulty' => 'HARD',
                'category' => 'Reverse Engineering',
                'version' => '2026.0.1',
                'status' => LabTemplateStatus::DRAFT,
                'base_port' => 8080,
                'image' => 'nginx:alpine',
            ],
        ];

        foreach ($labs as $row) {
            $lab = LabTemplate::query()->updateOrCreate(
                ['slug' => $row['slug'], 'version' => $row['version']],
                [
                    'template_family_uuid' => $row['family'],
                    'title' => $row['title'],
                    'difficulty' => $row['difficulty'],
                    'category' => $row['category'],
                    'short_description' => 'Hands-on cyber range lab for '.$row['title'],
                    'long_description' => '# '.$row['title']."\n\nFollow objectives and capture flags.",
                    'estimated_time_minutes' => 75,
                    'objectives' => ['Enumerate target', 'Exploit vector', 'Capture flag'],
                    'prerequisites' => ['Linux basics', 'HTTP basics'],
                    'tags' => ['training', 'ctf'],
                    'assets' => [],
                    'status' => $row['status'],
                    'is_latest' => true,
                    'published_at' => $row['status'] === LabTemplateStatus::PUBLISHED ? now() : null,
                    'changelog' => [[
                        'version' => $row['version'],
                        'date' => now()->toDateString(),
                        'notes' => 'Initial seeded version',
                    ]],
                    'lab_summary' => ['type' => 'container'],
                    'docker_image' => $row['image'],
                    'internal_port' => $row['base_port'],
                    'configuration_type' => 'docker-compose',
                    'configuration_content' => "version: '3.9'\nservices:\n  app:\n    image: {$row['image']}\n    ports:\n      - \"\\$".'{PORT}:'.$row['base_port']."\"\n",
                    'configuration_base_port' => $row['base_port'],
                    'env_vars' => ['APP_ENV' => 'training'],
                    'resource_limits' => ['memory' => '512m', 'cpus' => '0.5'],
                ]
            );

            for ($i = 1; $i <= 3; $i++) {
                Challenge::query()->updateOrCreate(
                    ['lab_template_id' => $lab->id, 'title' => 'Challenge '.$i],
                    [
                        'description' => 'Solve challenge '.$i.' for '.$row['title'],
                        'points' => 100 * $i,
                        'flag_hash' => password_hash('FLAG{'.$row['slug'].'_'.$i.'}', PASSWORD_ARGON2ID),
                        'max_attempts' => 10,
                        'cooldown_seconds' => 15,
                        'is_active' => true,
                    ]
                );
            }
        }

        $modules = [
            [
                'slug' => 'intro-pentesting',
                'title' => 'M1: Introduction & Ethics',
                'description' => 'Basics of Web Security, Ethics, Pentest Cycles, and Scoping.',
                'level' => ModuleLevel::BASIC,
                'status' => ModuleStatus::ACTIVE,
                'order_index' => 1,
                'lessons' => [
                    ['title' => 'What is Penetration Testing?', 'order_index' => 1, 'content' => "# Introduction\nPentesting is the practice of testing a computer system..."],
                    ['title' => 'Legal & Ethics', 'order_index' => 2, 'content' => "# Rules of Engagement\nAlways get written permission before testing..."],
                ],
            ],
            [
                'slug' => 'http-security',
                'title' => 'M2: HTTP/HTTPS & Headers',
                'description' => 'Understanding structure, security headers (HSTS, CSP), and traffic flow.',
                'level' => ModuleLevel::BASIC,
                'status' => ModuleStatus::ACTIVE,
                'order_index' => 2,
                'lessons' => [
                    ['title' => 'HTTP Request & Response', 'order_index' => 1, 'content' => "# HTTP Protocol\nUnderstanding verbs like GET, POST, PUT..."],
                ],
            ],
            [
                'slug' => 'sql-injection',
                'title' => 'M3: SQL Injection',
                'description' => 'Risk assessment, manual exploitation, and remediation of SQLi.',
                'level' => ModuleLevel::INTERMEDIATE,
                'status' => ModuleStatus::LOCKED,
                'order_index' => 3,
                'lessons' => [],
            ],
            [
                'slug' => 'burp-suite',
                'title' => 'M4: Burp Suite Fundamentals',
                'description' => 'Mastering Proxy, Repeater, and Intruder tools.',
                'level' => ModuleLevel::BASIC,
                'status' => ModuleStatus::LOCKED,
                'order_index' => 4,
                'lessons' => [],
            ],
            [
                'slug' => 'other-injections',
                'title' => 'M5: Advanced Injections',
                'description' => 'Command Injection, LDAP, XML/XXE, and NoSQL attacks.',
                'level' => ModuleLevel::ADVANCED,
                'status' => ModuleStatus::LOCKED,
                'order_index' => 5,
                'lessons' => [],
            ],
            [
                'slug' => 'xss',
                'title' => 'M6: Cross-Site Scripting (XSS)',
                'description' => 'Reflected, Stored, and DOM-based XSS attacks and defenses.',
                'level' => ModuleLevel::INTERMEDIATE,
                'status' => ModuleStatus::LOCKED,
                'order_index' => 6,
                'lessons' => [],
            ],
        ];

        foreach ($modules as $moduleRow) {
            $module = Module::query()->updateOrCreate(
                ['slug' => $moduleRow['slug']],
                [
                    'title' => $moduleRow['title'],
                    'description' => $moduleRow['description'],
                    'level' => $moduleRow['level'],
                    'status' => $moduleRow['status'],
                    'order_index' => $moduleRow['order_index'],
                ]
            );

            foreach ($moduleRow['lessons'] as $lessonRow) {
                Lesson::query()->updateOrCreate(
                    ['module_id' => $module->id, 'title' => $lessonRow['title']],
                    [
                        'content' => $lessonRow['content'],
                        'order_index' => $lessonRow['order_index'],
                    ]
                );
            }
        }
    }
}
