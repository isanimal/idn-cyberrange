# CyberRange Backend (v0.1)

Laravel 11 backend scaffold for cyber range platform.

## Includes in v0.1
- Sanctum auth (register/login/logout/me)
- Admin LabTemplate CRUD + publish/archive + audit logging
- User lab catalog + detail with `user_instance`
- Lab instance activate/deactivate/restart/upgrade stubs
- Docker orchestration via Symfony Process (`LocalDockerDriver`)
- Docker Compose stack: nginx, app, mysql, redis, horizon

## Orchestration (How It Works)
- User starts lab from API (`POST /api/v1/labs/{id_or_slug}/start` or `POST /api/v1/lab-instances`).
- Backend allocates host port from configured range (`DOCKER_LAB_PORT_RANGE_START..END`).
- Backend writes per-instance compose file into `DOCKER_LAB_RUNTIME_ROOT/<instance_id>/docker-compose.yml`.
- Compose is started by backend only (browser never talks to Docker directly).
- Runtime exports `PORT=<allocated_port>` before `docker compose up`, and validates port is numeric (`1..65535`).
- Containers are labeled with:
  - `lab_instance_id`
  - `user_id`
  - `lab_template_id`
- Runtime network is isolated per lab instance (`lab_<instance_id>`).
- Security hardening in local driver:
  - blocks dangerous compose directives (`docker.sock`, `privileged`, host namespace flags, etc.)
  - enforces `read_only`, `tmpfs /tmp`, `no-new-privileges`, `cap_drop: ALL`
  - applies resource limits from template/default env.
- TTL auto-stop:
  - instance expiry is set on activation/restart (`DOCKER_LAB_MAX_TTL_MINUTES`)
  - scheduled command `labs:cleanup-expired` runs every minute and stops expired active labs.
- Fail-fast docker healthcheck:
  - on app boot (when `DOCKER_LAB_DRIVER=local_docker`), backend runs orchestration preflight:
    - runtime root writable probe
    - `docker info` daemon reachability probe
  - if checks fail, backend returns structured remediation hints
  - toggle with `DOCKER_LAB_FAIL_FAST_DOCKER_CHECK=true|false` (default: true)

## Quick start
```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Or use compose:
```bash
docker compose up -d --build
```

## Docker Permissions
Lab orchestration needs backend process access to Docker daemon (`/var/run/docker.sock`).

### Mode A: Backend runs on host
1. Ensure Docker daemon is running.
2. Add backend service user into `docker` group:
   ```bash
   sudo usermod -aG docker <service-user>
   ```
3. Re-login (or restart service) so new group is applied.
4. Verify:
   ```bash
   docker info
   ```

### Mode B: Backend runs in container
Use compose override to mount docker socket:
```bash
docker compose -f docker-compose.yml -f docker-compose.backend-docker-socket.yml up -d --build
```

Override file example (`docker-compose.backend-docker-socket.yml`) mounts:
- `/var/run/docker.sock:/var/run/docker.sock`
- `/var/lib/idn-cyberrange:/var/lib/idn-cyberrange`
- `userns_mode: host` (recommended when Docker host enables `userns-remap`)
- `user: "0:0"` (simple mode), or use `group_add` with host docker GID for non-root container.
- optional `privileged: true` only as last resort.

If using GID mapping:
```bash
export DOCKER_GID=$(getent group docker | cut -d: -f3)
docker compose -f docker-compose.yml -f docker-compose.backend-docker-socket.yml up -d --build
```

### userns-remap note
If Docker daemon uses `userns-remap`, container UID/GID mapping can block socket/workdir operations even if mounted.
- Set backend container `userns_mode: host`.
- Keep runtime directory mounted and writable: `/var/lib/idn-cyberrange`.

### Rootless Docker note
For rootless daemon, socket is usually:
`unix:///run/user/<uid>/docker.sock`

Set backend env:
```bash
DOCKER_HOST=unix:///run/user/<uid>/docker.sock
```
And mount that socket path into backend runtime container.

### Optional `privileged: true` tradeoff
`privileged: true` can bypass permission issues quickly, but expands container privileges significantly.
Use only for controlled environments and prefer proper socket/group/userns configuration first.

### Scheduler for TTL cleanup
Run scheduler in local/dev if you want automatic expiry enforcement:
```bash
php artisan schedule:work
```
