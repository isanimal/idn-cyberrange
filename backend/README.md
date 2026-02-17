# CyberRange Backend (v0.1)

Laravel 11 backend scaffold for cyber range platform.

## Includes in v0.1
- Sanctum auth (register/login/logout/me)
- Admin LabTemplate CRUD + publish/archive + audit logging
- User lab catalog + detail with `user_instance`
- Lab instance activate/deactivate/restart/upgrade stubs
- Docker orchestration via Symfony Process (`LocalDockerDriver`)
- Docker Compose stack: nginx, app, mysql, redis, horizon

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
