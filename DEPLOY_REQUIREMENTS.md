# CyberRange Deployment Requirements

Dokumen ini adalah baseline requirement untuk menjalankan aplikasi CyberRange (Frontend + Laravel Backend) di server production agar bisa diakses banyak user.

## 1) Server Minimum
- CPU: 4 vCPU (recommended 8 vCPU)
- RAM: 8 GB (recommended 16 GB)
- Storage: 80 GB SSD (recommended 160 GB SSD)
- OS: Ubuntu 22.04/24.04 LTS (64-bit)

## 2) Runtime & Core Services
- Nginx: `>= 1.22`
- PHP-FPM: `8.3.x`
- Composer: `2.x`
- Node.js: `>= 20 LTS`
- NPM: `>= 10`
- MySQL: `8.x`
- Redis: `7.x`
- Supervisor (queue worker process manager)
- Docker Engine + Docker Compose plugin (untuk lab orchestration)

## 3) PHP Extensions (Wajib)
- `bcmath`
- `ctype`
- `curl`
- `dom`
- `fileinfo`
- `json`
- `mbstring`
- `openssl`
- `pdo`
- `pdo_mysql`
- `session`
- `tokenizer`
- `xml`
- `zip`
- `intl`

## 4) Backend Libraries (Composer)
Sumber: `backend/composer.json`

### Production requirements
- `php: ^8.3`
- `laravel/framework: ^11.0`
- `laravel/sanctum: ^4.0`
- `laravel/horizon: ^5.24`
- `ramsey/uuid: ^4.7`
- `symfony/process: ^7.0`

### Development/test requirements
- `phpunit/phpunit: ^11.0`
- `fakerphp/faker: ^1.23`
- `nunomaduro/collision: ^8.0`
- `mockery/mockery: ^1.6`

## 5) Frontend Libraries (NPM)
Sumber: `package.json`

### Runtime dependencies
- `react: ^19.2.4`
- `react-dom: ^19.2.4`
- `react-router-dom: ^7.13.0`
- `recharts: ^3.7.0`
- `react-markdown: ^10.1.0`
- `lucide-react: ^0.564.0`

### Build/dev dependencies
- `vite: ^6.2.0`
- `@vitejs/plugin-react: ^5.0.0`
- `typescript: ~5.8.2`
- `@types/node: ^22.14.0`

## 6) Network & Ports
- `80/443` : public HTTP/HTTPS (Nginx)
- `3306` : MySQL (internal/private, jangan expose publik)
- `6379` : Redis (internal/private)
- Dynamic lab port range: `20000-40000` (sesuai `DOCKER_LAB_PORT_RANGE_START/END`)

## 7) App Environment Variables (Wajib)
Backend (`backend/.env`):
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generated>`
- `APP_URL=<domain_public>`
- `DB_*` (MySQL 8)
- `REDIS_*`
- `QUEUE_CONNECTION=redis`
- `DOCKER_LAB_DRIVER=local_docker`
- `DOCKER_LAB_HOST=<public_or_private_host_for_lab_connection_url>`
- `DOCKER_LAB_RUNTIME_ROOT=/var/lib/idn-cyberrange/instances`
- `DOCKER_LAB_PORT_RANGE_START=20000`
- `DOCKER_LAB_PORT_RANGE_END=40000`

## 8) Permission & Filesystem
Directory berikut harus writable oleh user PHP-FPM:
- `backend/storage/`
- `backend/bootstrap/cache/`
- `DOCKER_LAB_RUNTIME_ROOT` (default: `/var/lib/idn-cyberrange/instances`)

## 9) Queue & Monitoring
- Jalankan queue worker via Supervisor atau gunakan Horizon:
- `php artisan horizon`

Disarankan health checks:
- API health endpoint (`/up`)
- MySQL connectivity
- Redis connectivity
- Queue backlog monitoring

## 10) Install Commands (Ringkas)
### Backend
```bash
cd backend
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --seed
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend
```bash
npm install
npm run build
```

## 11) Pre-GoLive Checklist
- [ ] `APP_DEBUG=false`
- [ ] HTTPS aktif (TLS)
- [ ] DB/Redis tidak diexpose publik
- [ ] Queue worker/Horizon aktif
- [ ] Migration sukses
- [ ] Seed admin user tersedia
- [ ] CORS dan Sanctum stateful domain sesuai domain production
- [ ] Backup policy untuk DB aktif
- [ ] Log rotation aktif
