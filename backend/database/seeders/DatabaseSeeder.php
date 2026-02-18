<?php

namespace Database\Seeders;

use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Challenge;
use App\Models\LabTemplate;
use App\Models\Module;
use App\Models\User;
use App\Models\UserModule;
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

        $exampleAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Example',
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
                    'configuration_content' => "services:\n  app:\n    image: {$row['image']}\n    ports:\n      - \"\\$".'{PORT}:'.$row['base_port']."\"\n",
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

        $this->call(ModuleSeeder::class);

        $firstModuleId = Module::query()
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->orderBy('order_index')
            ->value('id');

        if ($firstModuleId) {
            UserModule::query()->updateOrCreate(
                ['user_id' => $exampleAdmin->id, 'module_id' => $firstModuleId],
                [
                    'status' => UserModule::STATUS_ASSIGNED,
                    'assigned_at' => now(),
                ]
            );
        }
    }
}
