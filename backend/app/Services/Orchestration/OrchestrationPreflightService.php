<?php

namespace App\Services\Orchestration;

use App\Exceptions\OrchestrationPreflightException;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class OrchestrationPreflightService
{
    public function __construct(private readonly PublicLabAccessService $publicAccess)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function run(): array
    {
        $workdir = $this->checkWorkdir();
        $docker = $this->checkDocker();
        $publicEndpoint = $this->checkPublicEndpoint();
        $ok = $workdir['ok'] && $docker['ok'] && $publicEndpoint['ok'];

        return [
            'ok' => $ok,
            'checked_at' => now()->toIso8601String(),
            'checks' => [
                'workdir' => $workdir,
                'docker' => $docker,
                'public_endpoint' => $publicEndpoint,
            ],
        ];
    }

    public function assertReady(): void
    {
        $report = $this->run();
        if (! $report['ok']) {
            throw new OrchestrationPreflightException($report, 'Orchestration preflight failed. Check remediation hints in response details.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function checkWorkdir(): array
    {
        $root = rtrim((string) config('labs.runtime_root'), '/');
        $result = [
            'ok' => true,
            'path' => $root,
            'message' => 'Runtime root is writable.',
            'hints' => [],
        ];

        try {
            if (! is_dir($root) && ! @mkdir($root, 0775, true) && ! is_dir($root)) {
                throw new \RuntimeException("Unable to create runtime root: {$root}");
            }

            $probeDir = $root.'/.preflight-'.Str::lower(Str::random(8));
            if (! @mkdir($probeDir, 0775, true) && ! is_dir($probeDir)) {
                throw new \RuntimeException("Unable to create probe directory: {$probeDir}");
            }

            $probeFile = $probeDir.'/probe.txt';
            if (@file_put_contents($probeFile, 'ok') === false) {
                throw new \RuntimeException("Unable to write probe file: {$probeFile}");
            }

            @unlink($probeFile);
            @rmdir($probeDir);
        } catch (\Throwable $e) {
            $result['ok'] = false;
            $result['message'] = 'Runtime workdir root is not writable.';
            $result['error'] = $e->getMessage();
            $result['hints'] = [
                'Host mode (root/systemd): mkdir -p '.$root.' && chown -R <service-user>:<service-group> '.$root.' && chmod -R 775 '.$root,
                'Container mode: mount writable volume '.$root.':'.$root.' to backend container.',
                'If Docker host enables userns-remap, add userns_mode: host for backend container to align UID/GID mapping.',
                'For rootless setups, ensure backend user can write '.$root.' and uses matching DOCKER_HOST socket path.',
            ];
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function checkDocker(): array
    {
        $dockerHost = (string) (env('DOCKER_HOST') ?: 'unix:///var/run/docker.sock');
        $process = new Process(['docker', 'info']);
        $process->setTimeout(8);
        $process->run();

        $result = [
            'ok' => $process->isSuccessful(),
            'docker_host' => $dockerHost,
            'message' => $process->isSuccessful() ? 'Docker daemon reachable.' : 'Docker daemon unreachable.',
            'hints' => [],
        ];

        if ($process->isSuccessful()) {
            return $result;
        }

        $errorOutput = trim($process->getErrorOutput().' '.$process->getOutput());
        $result['error'] = $errorOutput;
        $result['hints'] = $this->dockerHints($errorOutput, $dockerHost);

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function checkPublicEndpoint(): array
    {
        $mode = strtolower((string) config('labs.public_port_mode', 'direct'));
        [$start, $end] = $this->publicAccess->allowedPortBounds();
        $publicHost = trim((string) config('labs.public_host', ''));
        $baseUrl = trim((string) config('labs.public_base_url', ''));

        $result = [
            'ok' => true,
            'mode' => $mode,
            'allowed_port_range' => "{$start}-{$end}",
            'message' => 'Public endpoint configuration is valid.',
            'hints' => [
                "Ensure firewall/security-group allows inbound TCP {$start}:{$end} for direct mode.",
                'For UFW: sudo ufw allow '.$start.':'.$end.'/tcp',
            ],
        ];

        if (! in_array($mode, ['direct', 'proxy'], true)) {
            $result['ok'] = false;
            $result['message'] = "Invalid CYBERRANGE_PUBLIC_PORT_MODE '{$mode}'. Use direct or proxy.";
            return $result;
        }

        if ($mode === 'proxy' && $baseUrl === '') {
            $result['ok'] = false;
            $result['message'] = 'CYBERRANGE_PUBLIC_BASE_URL is required in proxy mode.';
            $result['hints'][] = 'Set CYBERRANGE_PUBLIC_BASE_URL=https://labs.example.com.';
        }

        if ($mode === 'direct' && $publicHost === '') {
            $result['message'] = 'CYBERRANGE_PUBLIC_HOST not set; backend will fallback to request/app host.';
            $result['hints'][] = 'Set CYBERRANGE_PUBLIC_HOST to a routable IP or DNS name for consistent external URLs.';
        }

        return $result;
    }

    /**
     * @return array<int, string>
     */
    private function dockerHints(string $errorOutput, string $dockerHost): array
    {
        $normalized = strtolower($errorOutput);
        $hints = [];

        $hints[] = 'Host mode (root/systemd): run backend service as root or add service user to docker group (usermod -aG docker <service-user>) and restart service.';
        $hints[] = 'Container mode: mount /var/run/docker.sock and /var/lib/idn-cyberrange into backend container.';
        $hints[] = 'If Docker daemon uses userns-remap, set backend container userns_mode: host.';
        $hints[] = 'Rootless Docker: set DOCKER_HOST=unix:///run/user/<uid>/docker.sock and mount that socket path into backend container.';

        if (str_contains($normalized, 'permission denied') && str_contains($normalized, 'docker.sock')) {
            array_unshift($hints, 'Docker socket permission denied. Verify socket ownership/group and backend process privileges.');
        }

        if (str_contains($normalized, 'cannot connect to the docker daemon')) {
            array_unshift($hints, 'Docker daemon is not running or not reachable from current namespace/socket.');
        }

        if (str_contains($normalized, 'command not found') || str_contains($normalized, 'executable file not found')) {
            array_unshift($hints, "Docker CLI missing in backend runtime image. Install docker client and ensure it's in PATH.");
        }

        if (str_starts_with($dockerHost, 'unix:///run/user/')) {
            array_unshift($hints, 'Detected rootless DOCKER_HOST. Ensure this same socket is mounted and accessible in backend runtime.');
        }

        return array_values(array_unique($hints));
    }
}
