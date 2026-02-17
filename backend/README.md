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

### Scheduler for TTL cleanup
Run scheduler in local/dev if you want automatic expiry enforcement:
```bash
php artisan schedule:work
```
