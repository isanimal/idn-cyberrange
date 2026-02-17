<?php

return [
    'driver' => env('DOCKER_LAB_DRIVER', 'local_docker'),
    'network' => env('DOCKER_LAB_NETWORK', 'labs'),
    'host' => env('DOCKER_LAB_HOST', '127.0.0.1'),
    'runtime_root' => env('DOCKER_LAB_RUNTIME_ROOT', '/var/lib/idn-cyberrange/instances'),
    'port_start' => (int) env('DOCKER_LAB_PORT_RANGE_START', 20000),
    'port_end' => (int) env('DOCKER_LAB_PORT_RANGE_END', 40000),
];
