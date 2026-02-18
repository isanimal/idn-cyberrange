<?php

namespace App\Exceptions;

use RuntimeException;

class OrchestrationPreflightException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $report
     */
    public function __construct(
        private readonly array $report,
        string $message = 'Orchestration preflight failed.',
    ) {
        parent::__construct($message);
    }

    /**
     * @return array<string, mixed>
     */
    public function reportPayload(): array
    {
        return $this->report;
    }
}
