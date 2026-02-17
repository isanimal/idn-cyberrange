<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class AdminModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_module_and_lesson(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $createModule = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules', [
            'title' => 'M7: API Security',
            'slug' => 'api-security',
            'description' => 'Testing authz boundaries and rate limits.',
            'difficulty' => 'INTERMEDIATE',
            'status' => 'DRAFT',
            'category' => 'Web',
            'est_minutes' => 90,
            'version' => '0.1.0',
            'tags' => ['api', 'auth'],
            'order_index' => 7,
        ]);

        $createModule->assertCreated()
            ->assertJsonPath('slug', 'api-security')
            ->assertJsonPath('difficulty', 'INTERMEDIATE')
            ->assertJsonPath('status', 'DRAFT');

        $moduleId = $createModule->json('id');

        $createLesson = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules/'.$moduleId.'/lessons', [
            'title' => 'BOLA/BFLA',
            'content_md' => '# Broken Access Control',
            'order' => 1,
            'is_active' => true,
        ]);

        $createLesson->assertCreated()
            ->assertJsonPath('title', 'BOLA/BFLA')
            ->assertJsonPath('order', 1)
            ->assertJsonPath('is_active', true);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/modules/'.$moduleId.'/publish')
            ->assertOk()
            ->assertJsonPath('status', 'PUBLISHED');
    }

    public function test_non_admin_cannot_create_module(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/admin/modules', [
                'title' => 'Blocked',
                'slug' => 'blocked',
                'difficulty' => 'BASIC',
                'order_index' => 99,
            ])
            ->assertForbidden();
    }

    public function test_admin_can_upload_lesson_asset_file(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $createModule = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules', [
            'title' => 'M8: Asset Upload',
            'slug' => 'asset-upload',
            'difficulty' => 'BASIC',
            'order_index' => 8,
        ]);

        $moduleId = $createModule->json('id');
        $lesson = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules/'.$moduleId.'/lessons', [
            'title' => 'Images',
            'content_md' => 'Asset test',
            'order' => 1,
        ]);

        $lessonId = $lesson->json('id');
        $file = UploadedFile::fake()->image('diagram.png', 640, 480);

        $upload = $this->actingAs($admin, 'sanctum')->post('/api/v1/admin/lessons/'.$lessonId.'/assets', [
            'type' => 'IMAGE',
            'caption' => 'Diagram',
            'order_index' => 1,
            'file' => $file,
        ]);

        $upload->assertCreated()
            ->assertJsonPath('data.type', 'IMAGE')
            ->assertJsonPath('data.caption', 'Diagram');

        $url = (string) $upload->json('data.url');
        $this->assertStringStartsWith('/uploads/lessons/', $url);
        $this->assertTrue(File::exists(public_path(ltrim($url, '/'))));

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/modules/'.$moduleId.'/lessons/'.$lessonId)
            ->assertOk()
            ->assertJsonPath('data.assets.0.url', $url);
    }
}
