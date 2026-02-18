<?php

return [
    'driver' => env('DOCKER_LAB_DRIVER', 'local_docker'),
    'fail_fast_docker_check' => filter_var(env('DOCKER_LAB_FAIL_FAST_DOCKER_CHECK', true), FILTER_VALIDATE_BOOL),
    'network' => env('DOCKER_LAB_NETWORK', 'labs'),
    'host' => env('DOCKER_LAB_HOST', '127.0.0.1'),
    'runtime_root' => env('DOCKER_LAB_RUNTIME_ROOT', '/var/lib/idn-cyberrange/instances'),
    'port_start' => (int) env('DOCKER_LAB_PORT_RANGE_START', 20000),
    'port_end' => (int) env('DOCKER_LAB_PORT_RANGE_END', 40000),
    'max_ttl_minutes' => (int) env('DOCKER_LAB_MAX_TTL_MINUTES', 120),
    'compose_timeout_seconds' => (int) env('DOCKER_LAB_COMPOSE_TIMEOUT_SECONDS', 30),
    'default_memory_limit' => env('DOCKER_LAB_DEFAULT_MEMORY_LIMIT', '512m'),
    'default_cpu_limit' => env('DOCKER_LAB_DEFAULT_CPU_LIMIT', '0.5'),
];
