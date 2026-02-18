# Orchestration

## Driver abstraction
- `LabDriverInterface`
- `LocalDockerDriver` for runtime
- `FakeDockerDriver` for tests
- `FutureK8sDriver` placeholder

## Runtime flow
1. Activate instance allocates deterministic port from DB (`port_allocations.active_port`), range `20000-40000`.
2. Driver writes compose file under `${DOCKER_LAB_RUNTIME_ROOT}/{instance_id}/docker-compose.yml`.
3. Port publishing is forced to `0.0.0.0:${PORT}:<internal_port>` (never `127.0.0.1`).
4. Driver executes `docker compose up -d`.
5. Metadata is stored in:
- `lab_instances.runtime_metadata`
- `lab_instance_runtimes` table (`host_port`, `public_host`, `access_url`, `runtime_meta`)

## Stop / Restart / Upgrade
- Stop: `docker compose down -v`, release assigned port.
- Restart: `docker compose restart`.
- Upgrade:
- `RESET`: clears notes/progress/score and re-provisions target version.
- `IN_PLACE`: allowed only when compatibility checks pass (same family + same base/internal port).

## Cleanup strategy
- Force-stop and deactivate both release `port_allocations` (set `active_port = NULL`).
- Destroy removes runtime directory and compose artifacts.
- Recommended production policy: scheduled cleanup job for abandoned/expired instances and stale allocations.

## Public Access Configuration
- `CYBERRANGE_PUBLIC_PORT_MODE=direct|proxy`
- `CYBERRANGE_PUBLIC_HOST=<public-ip-or-domain>` (recommended for direct mode)
- `CYBERRANGE_PUBLIC_SCHEME=http|https`
- `CYBERRANGE_PUBLIC_BASE_URL=https://labs.example.com` (required for proxy mode)
- `CYBERRANGE_ALLOWED_PORT_RANGE=20000-40000`
- `CYBERRANGE_PUBLIC_PROXY_PATH_PREFIX=/lab` (proxy path mode)

### Direct mode URL
- Returned access URL: `http(s)://<CYBERRANGE_PUBLIC_HOST>:<allocated_port>`

### Proxy mode URL
- Returned access URL: `<CYBERRANGE_PUBLIC_BASE_URL>/lab/<instance_id>/` (prefix configurable).
- Reverse proxy should map that path to local `127.0.0.1:<host_port>`.

Example Nginx (path-based):
```nginx
location ~ ^/lab/([a-f0-9-]+)/ {
    # Resolve $upstream from your runtime map/router service.
    # Example runtime map entry: "<instance-id> 127.0.0.1:<host_port>;"
    proxy_pass http://$upstream/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
