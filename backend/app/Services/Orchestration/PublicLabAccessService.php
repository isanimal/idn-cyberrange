<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PublicLabAccessService
{
    /**
     * @return array{access_url: string, host_port: int, public_host: string, mode: string}
     */
    public function resolve(LabInstance $instance, int $hostPort): array
    {
        [$rangeStart, $rangeEnd] = $this->allowedPortBounds();
        if ($hostPort < $rangeStart || $hostPort > $rangeEnd) {
            throw new HttpException(422, "Assigned port {$hostPort} is outside allowed public range {$rangeStart}-{$rangeEnd}.");
        }

        $mode = strtolower((string) config('labs.public_port_mode', 'direct'));
        if (! in_array($mode, ['direct', 'proxy'], true)) {
            $mode = 'direct';
        }

        if ($mode === 'proxy') {
            $base = rtrim((string) config('labs.public_base_url', ''), '/');
            if ($base === '') {
                throw new HttpException(500, 'CYBERRANGE_PUBLIC_BASE_URL is required when CYBERRANGE_PUBLIC_PORT_MODE=proxy.');
            }

            $prefix = '/'.trim((string) config('labs.public_proxy_path_prefix', '/lab'), '/');
            $accessUrl = "{$base}{$prefix}/{$instance->id}/";

            return [
                'access_url' => $accessUrl,
                'host_port' => $hostPort,
                'public_host' => parse_url($base, PHP_URL_HOST) ?: 'proxy',
                'mode' => 'proxy',
            ];
        }

        $scheme = strtolower((string) config('labs.public_scheme', 'http'));
        if (! in_array($scheme, ['http', 'https'], true)) {
            $scheme = 'http';
        }

        $publicHost = $this->resolvePublicHost();
        $accessUrl = "{$scheme}://{$publicHost}:{$hostPort}";

        return [
            'access_url' => $accessUrl,
            'host_port' => $hostPort,
            'public_host' => $publicHost,
            'mode' => 'direct',
        ];
    }

    /**
     * @return array{0:int,1:int}
     */
    public function allowedPortBounds(): array
    {
        $configured = trim((string) config('labs.allowed_port_range', ''));
        if (preg_match('/^(\d+)\s*-\s*(\d+)$/', $configured, $matches) === 1) {
            $start = (int) $matches[1];
            $end = (int) $matches[2];
            if ($start > $end) {
                [$start, $end] = [$end, $start];
            }

            return [$start, $end];
        }

        $start = (int) config('labs.port_start', 20000);
        $end = (int) config('labs.port_end', 40000);
        if ($start > $end) {
            [$start, $end] = [$end, $start];
        }

        return [$start, $end];
    }

    private function resolvePublicHost(): string
    {
        $configured = trim((string) config('labs.public_host', ''));
        if ($configured !== '') {
            return $configured;
        }

        $request = request();
        if ($request !== null) {
            $host = trim((string) $request->getHost());
            if ($this->isSafePublicHost($host)) {
                return $host;
            }
        }

        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        if (is_string($appHost) && $this->isSafePublicHost($appHost)) {
            return $appHost;
        }

        $fallback = trim((string) config('labs.host', ''));
        if ($fallback !== '') {
            return $fallback;
        }

        return 'localhost';
    }

    private function isSafePublicHost(string $host): bool
    {
        if ($host === '' || Str::contains($host, ['localhost', '127.0.0.1', '0.0.0.0'])) {
            return false;
        }

        return true;
    }
}
