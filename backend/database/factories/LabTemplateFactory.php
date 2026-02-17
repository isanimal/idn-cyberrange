<?php

namespace Database\Factories;

use App\Enums\LabTemplateStatus;
use App\Models\LabTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class LabTemplateFactory extends Factory
{
    protected $model = LabTemplate::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'template_family_uuid' => (string) Str::uuid(),
            'slug' => Str::slug(fake()->unique()->words(3, true)).'-'.fake()->numberBetween(100, 999),
            'title' => fake()->sentence(3),
            'difficulty' => fake()->randomElement(['EASY', 'MEDIUM', 'HARD']),
            'category' => fake()->randomElement(['Web Security', 'Network', 'Reverse Engineering']),
            'short_description' => fake()->sentence(),
            'long_description' => '# '.fake()->sentence(3),
            'estimated_time_minutes' => fake()->numberBetween(30, 180),
            'objectives' => ['Objective A', 'Objective B'],
            'prerequisites' => ['Linux basics'],
            'tags' => ['owasp'],
            'version' => '2026.1.0',
            'status' => LabTemplateStatus::DRAFT,
            'is_latest' => true,
            'docker_image' => 'nginx:alpine',
            'internal_port' => 80,
            'env_vars' => ['APP_ENV' => 'training'],
            'resource_limits' => ['memory' => '256m'],
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => LabTemplateStatus::PUBLISHED,
            'published_at' => now(),
            'is_latest' => true,
        ]);
    }
}
