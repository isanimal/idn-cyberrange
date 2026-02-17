<?php

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\LabTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ChallengeFactory extends Factory
{
    protected $model = Challenge::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'lab_template_id' => LabTemplate::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'points' => fake()->numberBetween(50, 500),
            'flag_hash' => password_hash('FLAG{demo}', PASSWORD_ARGON2ID),
            'max_attempts' => 5,
            'cooldown_seconds' => 30,
            'is_active' => true,
        ];
    }
}
