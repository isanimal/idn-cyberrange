# Deploy on Ubuntu (Minimal)

## Prerequisites
- Ubuntu 22.04+
- Docker + Docker Compose plugin
- PHP 8.3 + extensions (`pdo_mysql`, `mbstring`, `bcmath`, `xml`, `curl`, `zip`)
- Composer
- MySQL 8
- Redis

## Setup
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
```

## Run API
```bash
php artisan serve --host=0.0.0.0 --port=8080
```

## Optional: Docker stack
```bash
docker compose up -d --build
docker compose exec app php artisan migrate --seed
```

## Production notes
- Run queue worker / Horizon.
- Protect `/admin/*` with strict role + network policy.
- Ensure `DOCKER_LAB_RUNTIME_ROOT` is writable by app user.
- Put Nginx reverse proxy + TLS in front.
