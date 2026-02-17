<?php

namespace Database\Seeders;

use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'slug' => 'intro-pentesting',
                'title' => 'M1: Introduction & Ethics',
                'description' => 'Basics of Web Security, Ethics, Pentest Cycles, and Scoping.',
                'level' => ModuleLevel::BASIC,
                'status' => ModuleStatus::ACTIVE,
                'order_index' => 1,
                'lessons' => [
                    ['title' => 'What is Penetration Testing?', 'order_index' => 1, 'content_markdown' => "# Introduction\nPentesting is the practice of testing a computer system..."],
                    ['title' => 'Legal & Ethics', 'order_index' => 2, 'content_markdown' => "# Rules of Engagement\nAlways get written permission before testing..."],
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
                    ['title' => 'HTTP Request & Response', 'order_index' => 1, 'content_markdown' => "# HTTP Protocol\nUnderstanding verbs like GET, POST, PUT..."],
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
                        'content_markdown' => $lessonRow['content_markdown'],
                        'content' => $lessonRow['content_markdown'],
                        'order_index' => $lessonRow['order_index'],
                    ]
                );
            }
        }
    }
}

