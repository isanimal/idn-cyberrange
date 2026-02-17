# API v1

Base path: `/api/v1`

## Auth
- `POST /login`
- `POST /register`
- `POST /logout`
- `GET /me`

## Labs (User)
- `GET /labs?search=&difficulty=&category=&tag=&sort=&page=&limit=`
- `GET /labs/{id_or_slug}`
- `POST /labs/{id}/activate` body: `{ pin_version?: string }`
- `GET /labs/{id}/challenges`
- `GET /me/lab-instances?state=&page=&limit=`
- `POST /lab-instances/{instance_id}/deactivate`
- `POST /lab-instances/{instance_id}/restart`
- `PATCH /lab-instances/{instance_id}` body: `{ notes?, progress_percent?, state? }`
- `POST /lab-instances/{instance_id}/upgrade` body: `{ to_version?: string, strategy: IN_PLACE|RESET }`

## Challenges
- `POST /challenges/{challenge_id}/submit` body: `{ flag: string }`

## Admin
- `GET/POST/PATCH/DELETE /admin/labs`
- `POST /admin/labs/{id}/publish` body: `{ version, notes }`
- `POST /admin/labs/{id}/archive`
- `GET/POST/PATCH/DELETE /admin/challenges`
- `GET /admin/users`
- `PATCH /admin/users/{id}` body: `{ status?: ACTIVE|SUSPENDED, reset_attempts?: bool }`
- `GET /admin/orchestration/instances`
- `POST /admin/orchestration/instances/{instance_id}/force-stop`

## Error model
- `422` validation error
- `403` forbidden
- `409` conflict
- `429` submission/attempt/cooldown throttles
