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

## Modules (User)
- `GET /modules`
  - visible modules only (`PUBLISHED`)
  - response: `{ data: [{ id, slug, title, description, difficulty, category, est_minutes, status, version, tags, cover_icon, order_index, lessons_count, progress_percent, is_locked, completed_at }] }`
- `GET /modules/{slug}`
  - response includes module metadata + lessons summary:
  - `{ id, slug, title, description, difficulty, category, est_minutes, status, version, tags, cover_icon, order_index, progress_percent, is_locked, lessons: [{ id, title, content_md, order, is_completed, completed_at }] }`
- `POST /modules/{slug}/start`
  - idempotent start/continue module progress
  - response: `{ data: { module_id, progress_percent, started_at, completed_at } }`
- `POST /modules/{slug}/lessons/{lessonId}/complete`
  - marks lesson complete and recalculates module progress
  - response: `{ data: { module_id, lesson_id, progress_percent, completed_at } }`

## Modules (Admin)
- `GET /admin/modules?status=DRAFT|PUBLISHED|ARCHIVED&per_page=20`
  - paginated response: `{ data: [...], meta: { page, per_page, total } }`
- `POST /admin/modules`
  - body: `{ title, slug?, description?, difficulty: BASIC|INTERMEDIATE|ADVANCED, category?, est_minutes?, status?: DRAFT|PUBLISHED|ARCHIVED, version?, tags?: string[], cover_icon?, order_index }`
- `GET /admin/modules/{id}`
  - response includes module + lessons
- `PATCH /admin/modules/{id}`
  - partial update of module fields
- `DELETE /admin/modules/{id}`
  - hard delete
- `POST /admin/modules/{id}/publish`
  - validates minimum publish requirements (title, slug, >=1 lesson)
- `POST /admin/modules/{id}/archive`
- `GET /admin/modules/{id}/lessons`
- `POST /admin/modules/{id}/lessons`
  - body: `{ title, content_md, order, is_active? }`
- `PATCH /admin/modules/{id}/lessons/{lesson_id}`
- `DELETE /admin/modules/{id}/lessons/{lesson_id}`
- `PATCH /admin/lessons/{id}`
- `DELETE /admin/lessons/{id}`

## Error model
- `422` validation error
- `403` forbidden
- `409` conflict
- `429` submission/attempt/cooldown throttles
