<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::query()->where('email', 'admin@cyberrange.local')->value('id');

        $modules = [
            [
                'slug' => 'intro-pentesting',
                'title' => 'M1: Introduction & Ethics',
                'description' => 'Basics of Web Security, Ethics, Pentest Cycles, and Scoping.',
                'difficulty' => 'BASIC',
                'status' => 'PUBLISHED',
                'category' => 'Web',
                'est_minutes' => 45,
                'version' => '0.1.0',
                'tags' => ['ethics', 'intro'],
                'order_index' => 1,
                'lessons' => [
                    ['title' => 'What is Penetration Testing?', 'order' => 1, 'content_md' => "# Introduction\nPentesting is the practice of testing a computer system..."],
                    ['title' => 'Legal & Ethics', 'order' => 2, 'content_md' => "# Rules of Engagement\nAlways get written permission before testing..."],
                ],
            ],
            [
                'slug' => 'http-security',
                'title' => 'M2: HTTP/HTTPS & Headers',
                'description' => 'Understanding structure, security headers (HSTS, CSP), and traffic flow.',
                'difficulty' => 'BASIC',
                'status' => 'PUBLISHED',
                'category' => 'Web',
                'est_minutes' => 60,
                'version' => '0.1.0',
                'tags' => ['http', 'headers'],
                'order_index' => 2,
                'lessons' => [
                    ['title' => 'HTTP Request & Response', 'order' => 1, 'content_md' => "# HTTP Protocol\nUnderstanding verbs like GET, POST, PUT..."],
                ],
            ],
            [
                'slug' => 'sql-injection',
                'title' => 'M3: SQL Injection',
                'description' => 'Risk assessment, manual exploitation, and remediation of SQLi.',
                'difficulty' => 'INTERMEDIATE',
                'status' => 'PUBLISHED',
                'category' => 'Web',
                'est_minutes' => 90,
                'version' => '0.1.0',
                'tags' => ['sqli'],
                'order_index' => 3,
                'lessons' => [],
            ],
            [
                'slug' => 'burp-suite',
                'title' => 'M4: Burp Suite Fundamentals',
                'description' => 'Mastering Proxy, Repeater, and Intruder tools.',
                'difficulty' => 'BASIC',
                'status' => 'PUBLISHED',
                'category' => 'Tooling',
                'est_minutes' => 70,
                'version' => '0.1.0',
                'tags' => ['burp'],
                'order_index' => 4,
                'lessons' => [],
            ],
            [
                'slug' => 'other-injections',
                'title' => 'M5: Advanced Injections',
                'description' => 'Command Injection, LDAP, XML/XXE, and NoSQL attacks.',
                'difficulty' => 'ADVANCED',
                'status' => 'PUBLISHED',
                'category' => 'Web',
                'est_minutes' => 95,
                'version' => '0.1.0',
                'tags' => ['command-injection', 'xxe'],
                'order_index' => 5,
                'lessons' => [],
            ],
            [
                'slug' => 'xss',
                'title' => 'M6: Cross-Site Scripting (XSS)',
                'description' => 'Reflected, Stored, and DOM-based XSS attacks and defenses.',
                'difficulty' => 'INTERMEDIATE',
                'status' => 'PUBLISHED',
                'category' => 'Web',
                'est_minutes' => 80,
                'version' => '0.1.0',
                'tags' => ['xss'],
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
                    'difficulty' => $moduleRow['difficulty'],
                    'level' => strtolower($moduleRow['difficulty']),
                    'status' => $moduleRow['status'] === 'DRAFT' ? 'draft' : 'active',
                    'category' => $moduleRow['category'],
                    'est_minutes' => $moduleRow['est_minutes'],
                    'version' => $moduleRow['version'],
                    'tags' => $moduleRow['tags'],
                    'created_by' => $adminId,
                    'archived_at' => $moduleRow['status'] === 'ARCHIVED' ? now() : null,
                    'order_index' => $moduleRow['order_index'],
                ]
            );

            foreach ($moduleRow['lessons'] as $lessonRow) {
                Lesson::query()->updateOrCreate(
                    ['module_id' => $module->id, 'title' => $lessonRow['title']],
                    [
                        'content_md' => $lessonRow['content_md'],
                        'content_markdown' => $lessonRow['content_md'],
                        'content' => $lessonRow['content_md'],
                        'order' => $lessonRow['order'],
                        'order_index' => $lessonRow['order'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
