<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use App\Services\Orchestration\LocalDockerDriver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalDockerDriverComposeTest extends TestCase
{
    use RefreshDatabase;

    public function test_generated_compose_binds_port_on_all_interfaces(): void
    {
        config()->set('labs.runtime_root', storage_path('framework/testing/lab-runtime'));

        $user = User::factory()->create();
        $template = LabTemplate::factory()->create([
            'status' => LabTemplateStatus::PUBLISHED,
            'configuration_content' => "services:\n  app:\n    image: nginx:alpine\n    ports:\n      - \"\${PORT}:80\"\n",
        ]);

        $instance = LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => LabInstanceState::INACTIVE,
            'progress_percent' => 0,
            'attempts_count' => 0,
            'notes' => '',
            'score' => 0,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);

        $driver = new LocalDockerDriver();
        $metadata = $driver->startInstance($instance, $template, 21050);

        $compose = file_get_contents($metadata['compose_path']);
        $this->assertStringContainsString('0.0.0.0:21050:80', (string) $compose);
        $this->assertStringNotContainsString('127.0.0.1:21050:80', (string) $compose);
    }
}
